---
layout: single
title: "7. Exactly Once Semantics (EOS)"
categories:
  - Kafka
  - Kafka와 메시징 큐
  - Kafka Messaging
tags:
  - Kafka
  - Kafka와 메시징 큐
  - Kafka Messaging
toc: true
toc_sticky: true
---
# Exactly Once Semantics (EOS)이란?

- Kafka에서 **중복 없이** 메시지를 **한 번만 처리**하고자 할 때 사용
- 특히 장애나 재시도 상황에서도 **메시지가 중복 전송되지 않도록** 하기 위한 설정
- Producer 측에서는 **Idempotent Producer** 설정을 통해 지원

<br>

# EOS가 필요해지는 이유

![20241122_211541.png](/assets/images/Kafka/Kafka와 메시징 큐/Kafka Messaging/07-Exactly Once Semantics(EOS)/20241122_211541.png)

- `acks` = 0: 프로듀서는 retry 하지 않아도 됨
- `acks` = 1: 프로듀서는 retry 할 일이 생김
    - 리더 파티션으로부터 응답을 받지 못하는 경우, 재발송

- `acks` = -1: 프로듀서는 retry 할 일이 더 자주 생김
    - 한 파티션에서라도 응답을 받지 못하는 경우, 재발송
    - 물론 모든 응답 전송의 주체는 리더 파티션

<br>

# EOS 컨셉

- Producer ID + 시퀀스 넘버를 유니크 키로 활용
    - 해당 키로 파티션은 중복 메시지를 구분
    
    ![20241122_211546.png](/assets/images/Kafka/Kafka와 메시징 큐/Kafka Messaging/07-Exactly Once Semantics(EOS)/20241122_211546.png)
    

<br>

# KafkaExactlyOnceSemanticsConfig

```java
@Configuration
public class KafkaExactlyOnceSemanticsConfig {

    @Bean
    @Qualifier("exactlyOnceSemanticsProducerFactory")
    public ProducerFactory<String, Object> exactlyOnceSemanticsProducerFactory(
          KafkaProperties kafkaProperties
    ) {
        return new DefaultKafkaProducerFactory<>(Map.of(
              ProducerConfig.BOOTSTRAP_SERVERS_CONFIG, kafkaProperties.getBootstrapServers(),
              ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG, kafkaProperties.getProducer().getKeySerializer(),
              ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG, kafkaProperties.getProducer().getValueSerializer(),
              ProducerConfig.ACKS_CONFIG, "all",
              ProducerConfig.ENABLE_IDEMPOTENCE_CONFIG, "true"
        ));
    }

    @Bean
    @Qualifier("exactlyOnceSemanticsKafkaTemplate")
    public KafkaTemplate<String, ?> exactlyOnceSemanticsKafkaTemplate(
          ProducerFactory<String, Object> exactlyOnceSemanticsProducerFactory
    ) {
        return new KafkaTemplate<>(exactlyOnceSemanticsProducerFactory);
    }
}

```

<br>

## `ProducerConfig.ENABLE_IDEMPOTENCE_CONFIG = true`

- **Kafka에서 가장 핵심적인 EOS 설정**
- 프로듀서가 **같은 메시지를 여러 번 보내더라도 브로커에서는 중복 저장되지 않도록 보장**
- 내부적으로는 다음 조건들을 자동으로 강제
    - `acks=all`
    - `retries > 0`
    - `max.in.flight.requests.per.connection ≤ 5`

<br>

## `ProducerConfig.ACKS_CONFIG = "all"`

- ISR(리더 + 팔로워) 모두에게 메시지가 저장된 이후에만 **ack 응답**
- 메시지 손실 방지에 중요한 설정 (안정성 ↑)

<br>

# 참고: 이것만으로 진짜 "Exactly Once"가 될까?

- 이 설정은 **Producer → Broker 사이**의 전송 중복 방지(idempotency)를 보장
- 하지만 진정한 의미의 end-to-end Exactly Once는 다음이 함께 필요
  
  
    | 항목 | 설명 |
    | --- | --- |
    | Kafka Transaction | 프로듀서가 여러 topic에 원자적으로 메시지 전송 가능 (ex: read-process-write) |
    | Consumer 수동 커밋 | 메시지 처리 후 offset 수동 커밋하여 중복 처리 방지 |
    | DB/외부 시스템과의 일관성 처리 | Kafka와 외부 시스템 간의 트랜잭션 동기화 고려 |