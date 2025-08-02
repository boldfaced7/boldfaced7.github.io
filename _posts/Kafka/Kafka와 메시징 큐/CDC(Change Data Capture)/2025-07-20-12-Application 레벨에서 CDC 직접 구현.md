---
layout: single
title: "2. Application 레벨에서 CDC 직접 구현"
categories:
  - Kafka
  - Kafka와 메시징 큐
  - CDC(Change Data Capture)
tags:
  - Kafka
  - Kafka와 메시징 큐
  - CDC(Change Data Capture)
toc: true
toc_sticky: true
---
## 1. `KafkaTemplate.send()` 직접 호출

- 트랜잭션이 걸린 서비스 메서드에서 DB 작업 후 바로 Kafka 메시지를 전송하는 방식

<br>

### 예시 코드

```java
@Transactional
public void createOrder(Order order) {
    orderRepository.save(order);                        // DB 저장
    kafkaTemplate.send("orders", order.getId(), order); // Kafka 메시지 전송
}
```

<br>

### 장점

- **구현의 단순성**: 코드 작성이 매우 직관적이고 간편한 구현
- **처리 속도**: 메시지 전송 과정이 빠르고 효율적인 처리

<br>

### 단점

- **데이터 정합성 문제**: Kafka 메시지가 DB 트랜잭션 커밋 이전에 전송되는 구조
- **커밋 실패 시의 불일치**: DB 커밋이 실패할 경우, Kafka에는 이미 메시지가 전달되어 데이터 정합성이 깨지는 위험
- **메시지 유실 가능성**: 애플리케이션 장애 시 메시지 유실의 가능성

<br>

### 언제 사용할까?

- **개발 초기 단계**: 기능 검증을 위한 초기 개발 단계
- **테스트 환경**: 실제 운영 환경이 아닌 테스트 용도의 활용
- **PoC (개념 증명) 단계**: 정합성보다 빠른 구현과 동작 확인이 중요한 PoC 단계
- **메시지 유실 허용**: 메시지 유실이 시스템에 치명적이지 않은 경우의 적용

<br>

---

## 2. `@TransactionalEventListener`

- 비즈니스 로직에서 Spring의 `ApplicationEvent`를 발행하고, 해당 이벤트를 트랜잭션 커밋 이후에 Kafka로 전송하는 방식

<br>

### 예시 코드

- 이벤트 발행

```java
@Transactional
public void createOrder(Order order) {
    orderRepository.save(order);
    applicationEventPublisher.publishEvent(new OrderCreatedEvent(order));
}
```



- 이벤트 처리

```java
@Component
public class OrderEventListener {

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handle(OrderCreatedEvent event) {
        kafkaTemplate.send("orders", event.getOrder().getId(), event.getOrder());
    }
}
```

<br>

### 장점

- **Spring 트랜잭션 통합**: Spring의 트랜잭션 시스템과 자연스럽게 통합되는 구조
- **선언적 프로그래밍**: 어노테이션 기반의 선언적이고 깔끔한 코드 구조
- **데이터 정합성 확보**: DB 트랜잭션 커밋 이후에만 메시지가 전송되어 데이터 정합성을 보장하는 방식

<br>

### 단점

- **이벤트 설계 및 관리**: 이벤트의 정의, 발행, 처리에 대한 명확한 설계와 지속적인 관리가 필요한 점
- **Spring 의존성**: Spring 프레임워크에 대한 높은 의존성

<br>

### 언제 사용할까?

- **Spring 기반 환경**: Spring 프레임워크를 사용하는 환경에서의 적용
- **안전하고 구조적인 CDC**: 데이터 정합성을 중요하게 고려하며 구조적인 CDC 구현이 필요한 경우
- **도메인 이벤트 기반 아키텍처**: 도메인 이벤트를 중심으로 설계된 아키텍처에 적합한 패턴



---

## 3. `@EntityListeners`, `@PostPersist`(JPA Entity Callback)

- JPA의 `@PostPersist`나 `@EntityListeners` 등을 활용하여 엔티티 저장 직후 Kafka로 메시지를 전송하는 방식

<br>

### 예시 코드

```java
@EntityListeners(OrderEntityListener.class)
@Entity
public class Order { ... }

public class OrderEntityListener {
    @PostPersist
    public void postPersist(Order order) {
        kafkaTemplate.send("orders", order.getId(), order); // ❌ 커밋 전!
    }
}
```

<br>

### 장점

- **비즈니스 로직 분리**: 핵심 비즈니스 로직과 메시지 전송 로직의 분리
- **간단한 구조**: 비교적 간단하게 구현 가능한 구조

<br>

### 단점

- **커밋 전 실행**: JPA 콜백이 DB 커밋 이전에 실행되는 특성
- **트랜잭션 롤백 시 정합성 문제**: 트랜잭션 롤백 시 Kafka 메시지는 이미 전송되어 데이터 정합성이 깨지는 위험

<br>

### 언제 사용할까?

- **메시지 유실 허용**: 메시지 유실이 허용되는 상황에서의 적용
- **참고용 로그 처리**: 데이터 정합성보다 정보 전달이 목적인 로그 처리 등의 용도

<br>

---

## 4. Spring Event System 확장 (Custom Publisher)

- Spring의 `ApplicationEventPublisher`를 확장하여 Kafka 메시지 전송과 통합하는 방식

<br>

### 예시 코드

```java
public class KafkaEventPublisher {
    public void publish(Object event) {
        applicationEventPublisher.publishEvent(event);
        // Kafka 전송도 같이 진행
    }
}
```

- 또는 `@Async`, `@EventListener`를 활용하여 Spring 내부 이벤트를 Kafka 메시지 전송으로 처리하는 방식

<br>

### 장점

- **Spring 내부 이벤트 아키텍처 통합**: Spring의 이벤트 아키텍처와 긴밀하게 통합되는 구조
- **다중 구독자 처리**: Kafka 전송 외에도 여러 구독자에게 이벤트를 처리할 수 있는 유연성

<br>

### 단점

- **아키텍처 복잡성 증가**: 시스템의 아키텍처 복잡도가 증가하는 경향
- **Spring Events 이해 필요**: Spring Events 메커니즘에 대한 깊은 이해가 필요한 점

<br>

---

## 5. Outbox 패턴

- Kafka 메시지를 DB에 함께 커밋 가능한 **Outbox 테이블**에 먼저 저장하고, 별도의 프로세스가 이 테이블을 읽어 Kafka로 전송하는 방식

<br>

### 예시 구조

- 트랜잭션 내

```java
@Transactional
public void createOrder(Order order) {
    orderRepository.save(order);
    outboxRepository.save(new OutboxEvent(...)); // Kafka 메시지 대신 저장
}
```

- 전송 프로세스 (Scheduler or Polling)

```java
List<OutboxEvent> events = outboxRepository.findUnprocessed();

for (OutboxEvent event : events) {
    kafkaTemplate.send(event.getTopic(), event.getPayload());
    event.markProcessed();
}
```

<br>

### 장점

- **데이터 정합성 100% 확보**: DB 트랜잭션과 Kafka 메시지 전송의 정합성을 완벽하게 보장하는 방식
- **재처리 가능성**: Kafka 전송 실패 시에도 메시지를 안전하게 재처리할 수 있는 구조
- **메시지 유실 방지**: 시스템 장애에도 메시지 유실을 방지하는 견고함

<br>

### 단점

- **Outbox 테이블 관리**: Outbox 테이블의 생성, 관리 및 모니터링이 필요한 점
- **전송 프로세스 관리**: 별도의 메시지 전송 프로세스(스케줄러 또는 폴링)의 구현과 관리가 필요한 점
- **구현 복잡도 증가**: 다른 방식에 비해 구현의 복잡도가 증가하는 경향

<br>

### 언제 사용할까?

- **데이터 정합성 중요 서비스**: 데이터 정합성이 매우 중요한 금융, 결제 등의 서비스
- **고신뢰 메시징 시스템**: 메시지 유실이 절대 허용되지 않는 고신뢰 메시징 시스템 구축 시
- **재처리 가능한 시스템**: 메시지 전송 실패 시 재처리가 필수적인 시스템

<br>

---

## 비교 요약

| 방법 | 정합성 | 복잡도 | 실시간성 | 추천 상황 |
| --- | --- | --- | --- | --- |
| 서비스 메서드 내 send() | ❌ (낮음) | ⭐ (매우 낮음) | ✅ (높음) | 테스트/샘플 코드, 메시지 유실 허용 시 |
| Event System 통합 | ✅ (높음) | ⭐⭐⭐ (높음) | ✅ (높음) | 이벤트 지향 시스템, Spring 환경 |
| EntityListener | ❌ (낮음) | ⭐ (매우 낮음) | ✅ (높음) | 로그용 처리, 메시지 유실 허용 시 |
| @TransactionalEventListener | ✅ (높음) | ⭐⭐ (중간) | ✅ (높음) | Spring 구조 지향, 데이터 정합성 필요 시 |
| Outbox 패턴 | ✅✅ (최상) | ⭐⭐⭐ (높음) | or ❌ (배치) | 고신뢰 시스템, 데이터 정합성 필수 시 |