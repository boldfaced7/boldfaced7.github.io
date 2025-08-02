---
layout: single
title: "2. Batch Listener"
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
# KafkaBatchConfig

```java
public class KafkaBatchConfig {

    @Bean
    @Qualifier("batchConsumerFactory")
    public ConsumerFactory<String, Object> batchConsumerFactory(
            KafkaProperties basicKafkaProperties
    ) {
        return new DefaultKafkaConsumerFactory<>(Map.of(
            ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, kafkaProperties.getBootstrapServers(),
            ConsumerConfig.KEY_DESERIALIZER_CLASS_CONFIG, kafkaProperties.getConsumer().getKeyDeserializer(),
            ConsumerConfig.VALUE_DESERIALIZER_CLASS_CONFIG, kafkaProperties.getConsumer().getValueDeserializer(),
            JsonDeserializer.TRUSTED_PACKAGES, "*",
            ConsumerConfig.AUTO_OFFSET_RESET_CONFIG, "latest",
            ConsumerConfig.ALLOW_AUTO_CREATE_TOPICS_CONFIG, "false",
            // 추가
            ConsumerConfig.MAX_POLL_RECORDS_CONFIG, ConsumerConfig.DEFAULT_MAX_POLL_RECORDS
        ));
    }

    @Bean
    @Qualifier("batchKafkaListenerContainerFactory")
    public ConcurrentKafkaListenerContainerFactory<String, Object> batchKafkaListenerContainerFactory(
            ConsumerFactory<String, Object> batchConsumerFactory
    ) {
        ConcurrentKafkaListenerContainerFactory<String, Object> factory
                = new ConcurrentKafkaListenerContainerFactory<>();

        factory.setConsumerFactory(batchConsumerFactory);
        factory.setBatchListener(true); // 추가
        factory.setConcurrency(1);
        factory.getContainerProperties()
            .setAckMode(ContainerProperties.AckMode.BATCH); // 추가

        return factory;
    }
}
```

<br>

## `ConsumerConfig.MAX_POLL_RECORDS_CONFIG`

- 역할: `poll()` 호출 시 Kafka에서 가져올 수 있는 최대 레코드 수를 지정
- `DEFAULT_MAX_POLL_RECORDS` 값은 `500` (Kafka 기본값)

<br>

## `factory.setBatchListener(true)`

- 역할: `@KafkaListener` 메서드가 배치(batch) 모드로 동작하도록 설정
- 이 설정이 true이면, `@KafkaListener`는 `ConsumerRecord` 하나가 아닌 `List<ConsumerRecord>` 형태로 메시지를 수신

<br>

## `setAckMode(ContainerProperties.AckMode.BATCH)`

- 역할: 수동 커밋(acknowledgement) 모드일 때, 배치 단위로 offset을 커밋하겠다는 의미
- `AckMode.BATCH`은 배치로 가져온 레코드들이 모두 성공적으로 처리된 뒤 한 번만 offset을 커밋
  
    ➡ 이 설정은 수동 커밋을 쓸 때 의미가 있음
    
    | AckMode 종류 | 설명 |
    | --- | --- |
    | `RECORD` | 메시지 한 건 처리할 때마다 커밋 |
    | `BATCH` | 배치 단위로 커밋 |
    | `TIME` | 일정 시간마다 커밋 |
    | `COUNT` | 일정 개수 처리마다 커밋 |
    | `MANUAL` | 명시적으로 ack 객체를 호출할 때만 커밋 |
    | `MANUAL_IMMEDIATE` | 명시적으로 ack 객체를 호출할 때만 커밋 |

<br>

# BatchConsumer

```java
@Component
public class BatchConsumer {

    @KafkaListener(
            topics = {"my-basic-topic"},
            groupId = "batch-test-consumer-group",
            containerFactory = "batchKafkaListenerContainerFactory"
    )
    public void accept(List<ConsumerRecord<String, MyMessage>> messages) {
        System.out.printf(
            "[MyBatchConsumer] Batch message arrived! - count %s\n",
            messages.size()
        );
        messages.forEach(message ->
            System.out.printf(
                "[MyBatchConsumer] Value - %s / Offset - %s / Partition - %s\n",
                message.value(),
                message.offset(),
                message.partition()
            )
        );
    }
}
```