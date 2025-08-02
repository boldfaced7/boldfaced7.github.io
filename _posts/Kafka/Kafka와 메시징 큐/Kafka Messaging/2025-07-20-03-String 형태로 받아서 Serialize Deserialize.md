---
layout: single
title: "3. String 형태로 받아서 Serialize, Deserialize"
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
# `application.yml`

- `application.yml`에 다음 내용을 추가

```yaml
spring:
  kafka:
    string:
      bootstrap-servers: localhost:9092,localhost:9093,localhost:9094
      consumer:
        key-deserializer: org.apache.kafka.common.serialization.StringDeserializer
        value-deserializer: org.apache.kafka.common.serialization.StringDeserializer
      listener:
        concurrency: 1
      producer:
        key-serializer: org.apache.kafka.common.serialization.StringSerializer
        value-serializer: org.apache.kafka.common.serialization.StringSerializer
        acks: 0
```

<br>

# KafkaStringConfig

```java
@Configuration
public class KafkaStringConfig {

    @Bean
    @Qualifier("stringKafkaProperties")
    @ConfigurationProperties("spring.kafka.string")
    public KafkaProperties stringKafkaProperties() {
        return new KafkaProperties();
    }

    @Bean
    @Qualifier("stringConsumerFactory")
    public ConsumerFactory<String, Object> stringConsumerFactory(
		    KafkaProperties stringKafkaProperties
		) {
        return new DefaultKafkaConsumerFactory<>(Map.of(
            ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, stringKafkaProperties.getBootstrapServers(),
            ConsumerConfig.KEY_DESERIALIZER_CLASS_CONFIG, stringKafkaProperties.getConsumer().getKeyDeserializer(),
            ConsumerConfig.VALUE_DESERIALIZER_CLASS_CONFIG, stringKafkaProperties.getConsumer().getValueDeserializer(),
            ConsumerConfig.AUTO_OFFSET_RESET_CONFIG, "latest",
            ConsumerConfig.ALLOW_AUTO_CREATE_TOPICS_CONFIG, "false"
        ));
    }

    @Bean
    @Qualifier("stringKafkaListenerContainerFactory")
    public ConcurrentKafkaListenerContainerFactory<String, Object> stringKafkaListenerContainerFactory(
            ConsumerFactory<String, Object> stringConsumerFactory
    ) {
        ConcurrentKafkaListenerContainerFactory<String, Object> factory
            = new ConcurrentKafkaListenerContainerFactory<>();

        factory.setConsumerFactory(stringConsumerFactory);
        factory.setConcurrency(1);

        return factory;
    }

    @Bean
    @Qualifier("stringProducerFactory")
    public ProducerFactory<String, Object> stringProducerFactory(KafkaProperties stringKafkaProperties) {
        return new DefaultKafkaProducerFactory<>(Map.of(
            ProducerConfig.BOOTSTRAP_SERVERS_CONFIG, stringKafkaProperties.getBootstrapServers(),
            ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG, stringKafkaProperties.getProducer().getKeySerializer(),
            ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG, stringKafkaProperties.getProducer().getValueSerializer(),
            ProducerConfig.ACKS_CONFIG, stringKafkaProperties.getProducer().getAcks()
        ));
    }

    @Bean
    @Qualifier("stringKafkaTemplate")
    public KafkaTemplate<String, ?> stringKafkaTemplate(
		    ProducerFactory<String, Object> stringProducerFactory
    ) {
        return new KafkaTemplate<>(stringProducerFactory);
    }
}
```

<br>

# StringProducer

```java
@Component
@RequiredArgsConstructor
public class StringProducer {

    private final KafkaTemplate<String, String> kafkaTemplate;

    public void sendMessage(String key, String myMessage) {
        kafkaTemplate.send(
		        "my-string-topic", 
		        key, 
		        myMessage
        );
    }
}
```

<br>

# StringConsumer

```java
@Component
public class MyStringConsumer {

    @KafkaListener(
            topics = {"my-string-topic"},
            groupId = "test-consumer-group",
            containerFactory = "stringKafkaListenerContainerFactory"
    )
    public void accept(ConsumerRecord<String, String> message) {
        System.out.printf(
            """
	              [MyStringConsumer] message arrived!
	              [MyStringConsumer] Value - %s / Offset - %s / Partition - %s\n
            """,
            message.value(),
            message.offset(),
            message.partition()
        );
    }
}
```