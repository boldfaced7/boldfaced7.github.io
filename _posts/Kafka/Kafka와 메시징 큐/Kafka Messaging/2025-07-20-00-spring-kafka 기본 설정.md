---
layout: single
title: "0. Spring Kafka 기본 설정"
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

## `application.yml`

- Spring Boot 애플리케이션에서 Kafka 관련 설정을 정의하는 파일
- Kafka 브로커 연결 정보, 메시지 직렬화/역직렬화 방식, 프로듀서 및 컨슈머의 동작 방식을 구성하는 역할

<br>

### `acks` 설정

- 프로듀서가 메시지를 전송한 후, Kafka 브로커로부터 얼마나 많은 응답을 기다릴지 결정하는 중요한 설정

| `acks` 값 | 의미 |
| --- | --- |
| `0` | 프로듀서는 메시지 전송 후 리더 파티션의 저장 결과를 기다리지 않는 방식. 가장 빠른 전송 속도를 제공하지만, 메시지 유실의 가능성이 높은 특징 |
| `1` | 프로듀서는 리더 파티션에 메시지가 성공적으로 저장되었음을 확인하는 방식. `0`보다는 안전하지만, 리더 파티션 장애 시 메시지 유실의 가능성 |
| `-1` | 프로듀서는 모든 인-싱크 레플리카(ISR)에 메시지가 성공적으로 복제되었음을 확인하는 방식. 가장 높은 수준의 메시지 내구성을 보장하지만, 전송 속도는 가장 느린 특징 |

```yaml
spring:
  kafka:
    bootstrap-servers: localhost:9092,localhost:9093,localhost:9094 # Kafka 브로커 연결 주소 목록
    consumer:
      key-deserializer: org.apache.kafka.common.serialization.StringDeserializer # 컨슈머 키 역직렬화 클래스
      value-deserializer: org.springframework.kafka.support.serializer.JsonDeserializer # 컨슈머 값 역직렬화 클래스 (JSON 형식)
    listener:
      concurrency: 1 # 컨슈머 리스너의 동시성 레벨 (동시에 실행될 컨슈머 스레드 수)
    producer:
      key-serializer: org.apache.kafka.common.serialization.StringSerializer # 프로듀서 키 직렬화 클래스
      value-serializer: org.springframework.kafka.support.serializer.JsonSerializer # 프로듀서 값 직렬화 클래스 (JSON 형식)
      acks: -1 # 프로듀서의 메시지 전송 승인 모드 (모든 ISR에 복제될 때까지 대기)
```

<br>

## KafkaBasicConfig

- Spring 애플리케이션에서 Kafka 관련 빈(Bean)들을 수동으로 설정하는 구성 클래스
- `KafkaProperties`, `ConsumerFactory`, `ProducerFactory`, `KafkaTemplate` 등을 정의하여 Kafka 클라이언트의 동작을 세밀하게 제어하는 역할

```java
@Configuration
public class KafkaBasicConfig {

		@Bean
		@Qualifier("basicKafkaProperties")
		@ConfigurationProperties("spring.kafka")
		public KafkaProperties basicKafkaProperties() {
				return new KafkaProperties(); // application.yml의 spring.kafka 설정을 로드하는 빈
		}
		
		// Consumer 관련 설정
		@Bean
		@Qualifier("basicConsumerFactory")
		public ConsumerFactory<String, Object> basicConsumerFactory(
				KafkaProperties basicKafkaProperties
		) {
        return new DefaultKafkaConsumerFactory<>(Map.of(
            ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, basicKafkaProperties.getBootstrapServers(), // 브로커 서버 설정
            ConsumerConfig.KEY_DESERIALIZER_CLASS_CONFIG, basicKafkaProperties.getConsumer().getKeyDeserializer(), // 키 역직렬화 클래스 설정
            ConsumerConfig.VALUE_DESERIALIZER_CLASS_CONFIG, basicKafkaProperties.getConsumer().getValueDeserializer(), // 값 역직렬화 클래스 설정
            ConsumerConfig.AUTO_OFFSET_RESET_CONFIG, "latest", // 오프셋이 없을 경우 최신 메시지부터 읽는 설정
            ConsumerConfig.ALLOW_AUTO_CREATE_TOPICS_CONFIG, "false", // 토픽 자동 생성을 비활성화하는 설정
            JsonDeserializer.TRUSTED_PACKAGES, "*" // JSON 역직렬화 시 모든 패키지의 클래스를 신뢰하는 설정 (보안 주의)
        ));
		}
		
		@Bean
		@Qualifier("basicKafkaListenerContainerFactory")
		public ConcurrentKafkaListenerContainerFactory<String, Object> basicKafkaListenerContainerFactory(
				ConsumerFactory<String, Object> basicConsumerFactory
		) {
				ConcurrentKafkaListenerContainerFactory<String, Object> factory
						= new ConcurrentKafkaListenerContainerFactory<>();
						
				factory.setConsumerFactory(basicConsumerFactory); // 컨슈머 팩토리 설정
				factory.setConcurrency(1); // 컨슈머 리스너의 동시성 레벨 설정
				
				return factory;
		}
		
		// Producer 관련 설정
		@Bean
		@Qualifier("basicProducerFactory")
		public ProducerFactory<String, Object> basicProducerFactory(
				KafkaProperties basicKafkaProperties
		) {
        return new DefaultKafkaProducerFactory<>(Map.of(
            ProducerConfig.BOOTSTRAP_SERVERS_CONFIG, basicKafkaProperties.getBootstrapServers(), // 브로커 서버 설정
            ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG, basicKafkaProperties.getProducer().getKeySerializer(), // 키 직렬화 클래스 설정
            ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG, basicKafkaProperties.getProducer().getValueSerializer(), // 값 직렬화 클래스 설정
            ProducerConfig.ACKS_CONFIG, basicKafkaProperties.getProducer().getAcks() // acks 설정
        ));
		}
		
		@Bean
		@Qualifier("basicKafkaTemplate")
		public KafkaTemplate<String, ?> basicKafkaTemplate(
				ProducerFactory<String, Object> basicProducerFactory
		) {
				return new KafkaTemplate<>(basicProducerFactory); // Kafka 메시지 전송을 위한 템플릿 빈
		}
}
```

<br>

## ConsumerFactory 설정 상세

- `AUTO_OFFSET_RESET_CONFIG`: `"latest"`로 설정 시, 컨슈머 그룹에 커밋된 오프셋이 없는 경우 가장 최신 메시지부터 읽기 시작하는 동작
- `ALLOW_AUTO_CREATE_TOPICS_CONFIG`: `"false"`로 설정 시, 컨슈머가 존재하지 않는 토픽을 구독하더라도 Kafka 브로커가 해당 토픽을 자동으로 생성하지 않도록 방지하는 설정
- `JsonDeserializer.TRUSTED_PACKAGES = "*"`: JSON 역직렬화 시 모든 패키지의 클래스를 신뢰하도록 허용하는 설정. 이는 개발 편의성을 높이지만, 보안상의 이유로 실제 운영 환경에서는 역직렬화할 클래스 패키지를 명시적으로 지정하는 것이 안전한 방법