---
layout: single
title: "1. 기본 Produce, Consume"
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
## MyMessage

- Kafka 메시지의 페이로드로 사용될 데이터 모델 정의
- `id`, `age`, `name`, `content`와 같은 필드를 포함하는 일반적인 자바 객체
- `@Data` 어노테이션을 통해 Lombok 라이브러리의 편의 기능을 활용하는 구조

```java
@Data
public class MyMessage {
    private int id;
    private int age;
    private String name;
    private String content;
}
```

<br>

## BasicConsumer

- Kafka 토픽으로부터 메시지를 수신하는 컴포넌트
- `@KafkaListener` 어노테이션을 사용하여 특정 토픽(`my-basic-topic`)과 컨슈머 그룹(`test-consumer-group`)을 지정하는 방식
- `accept` 메서드는 `ConsumerRecord` 객체를 인자로 받아 메시지의 값(`message.value()`)을 출력하는 로직

```java
@Component
public class BasicConsumer {

		@KafkaListener(
				topics = {"my-basic-topic"},
				groupId = "test-consumer-group"
		)
		public void accept(ConsumerRecord<String, MyMessage> message) {
        System.out.println("[MyConsumer] Message arrived! - " + message.value());
		}
}
```

<br>

## BasicProducer

- Kafka 토픽으로 메시지를 전송하는 컴포넌트
- `KafkaTemplate`을 주입받아 메시지 전송 기능을 활용하는 구조
- `sendMessage` 메서드는 `MyMessage` 객체를 받아 지정된 토픽(`my-basic-topic`), 키(`myMessage.getAge()`의 문자열 변환), 값(`myMessage`)으로 메시지를 전송하는 역할

```java

@Component
@RequiredArgsConstructor
public class BasicProducer {

		private final KafkaTemplate<String, MyMessage> kafkaTemplate;
		
		public void sendMessage(MyMessage myMessage) {
				kafkaTemplate.send(
						"my-basic-topic",                   // Topic Name
						String.valueOf(myMessage.getAge()), // Key
						myMessage                           // Value
				);
		}
}
```

<br>

## kafkaTemplate.send()

- `KafkaTemplate`의 `send` 메서드는 Kafka로 메시지를 비동기적으로 전송하는 핵심 기능
- 토픽 이름, 메시지 키, 메시지 값을 인자로 받아 `ProducerRecord`를 생성하는 과정
- 메시지 전송 결과는 `CompletableFuture` 객체로 반환되어 비동기 처리의 유연성 제공
- Kafka 브로커로의 실제 메시지 전송을 담당하는 내부 로직

```java
public CompletableFuture<SendResult<K, V>> send(String topic, K key, @Nullable V data) {
    ProducerRecord<K, V> V> producerRecord = new ProducerRecord(topic, key, data);
    return this.observeSend(producerRecord);
}
```