---
layout: single
title: "3. 대비 방안 (2) Error Handler"
categories:
  - Kafka
  - Kafka와 메시징 큐
  - 예외 통제(Exception handling)
tags:
  - Kafka
  - Kafka와 메시징 큐
  - 예외 통제(Exception handling)
toc: true
toc_sticky: true
---
- ErrorHandle 정책도 커스터마이징 가능

![20241122_211959.png](/assets/images/Kafka/Kafka와 메시징 큐/예외 통제(Exception handling)/18-대비 방안 (2) Error Handler/20241122_211959.png)



# Comsume 실패 사례

- 101번 Message Consume에 실패해 재시도
  
    ![20241122_212002.png](/assets/images/Kafka/Kafka와 메시징 큐/예외 통제(Exception handling)/18-대비 방안 (2) Error Handler/20241122_212002.png)
    
- 재시도를 했지만 결국 실패
  
    ![20241122_212007.png](/assets/images/Kafka/Kafka와 메시징 큐/예외 통제(Exception handling)/18-대비 방안 (2) Error Handler/20241122_212007.png)
    

<br>

## 실패한 Message를 처리하지 않고 넘김

![20241122_212011.png](/assets/images/Kafka/Kafka와 메시징 큐/예외 통제(Exception handling)/18-대비 방안 (2) Error Handler/20241122_212011.png)

- Message 처리 실패 시, 102번 메시지부터 다시 처리
- `DefaultErrorHandler` 사용 시의 기본 값

<br>

## 실패한 Message를 처리하지 않고 멈춤

![20241122_212028.png](/assets/images/Kafka/Kafka와 메시징 큐/예외 통제(Exception handling)/18-대비 방안 (2) Error Handler/20241122_212028.png)

- Message 처리 실패 시 Consumer는 멈춤
    - Consumer를 되살리지 않으면 이후 메시지를 처리하지 않음

<br> 

# 구현

## `KafkaCustomErrorHandlerConsumerConfig`

```java
@Configuration
public class KafkaCustomErrorHandlerConsumerConfig {

	@Bean
	@Primary
	public CommonErrorHandler errorHandler() {
		var cseh = new CommonContainerStoppingErrorHandler();
		var consumerRef  = new AtomicReference<Consumer<?, ?>>();
		var containerRef = new AtomicReference<MessageListenerContainer>();
		
		var errorhandler = new DefaultErrorHandler(
				(record, exception) -> cseh.handleRemaining(
						exception, 
						Collections.singletonList(record), 
						consumerRef.get(), 
						containerRef.get()
				), generatedBackOff()) {
		
			@Override
			public void handleRemaining(
					Exception thrownException,
					List<ConsumerRecord<?, ?>> records,
					Consumer<?, ?> consumer,
					MessageListenerContainer container
			) {
				consumerRef.set(consumer);
				containerRef.set(container);
				super.handleRemaining(thrownException, records, consumer, container);
			}
		};
		errorhandler.addNotRetryableExceptions(IllegalArgumentException.class);
		return errorhandler;
	}
	
	@Bean
	@Qualifier("customErrorHandlerKafkaListenerContainerFactory")
	public ConcurrentKafkaListenerContainerFactory<String, Object> customErrorHandlerKafkaListenerContainerFactory(
			ConsumerFactory<String, Object> consumerFactory,
			CommonErrorHandler errorHandler
	) {
		ConcurrentKafkaListenerContainerFactory<String, Object> factory
		= new ConcurrentKafkaListenerContainerFactory<>();
		
		factory.setConsumerFactory(consumerFactory);
		factory.getContainerProperties().setAckMode(ContainerProperties.AckMode.MANUAL);
		factory.setConcurrency(1);
		factory.setCommonErrorHandler(errorHandler);
		
		return factory;
	}
	
	private BackOff generatedBackOff() {
		ExponentialBackOff backOff = new ExponentialBackOff(1000L, 2L);
		backOff.setMaxElapsedTime(10000L);
		return backOff;
	}
}
```

<br>

### `CommonContainerStoppingErrorHandler`

```java
var cseh = new CommonContainerStoppingErrorHandler();
```

- Spring Kafka가 제공하는 기본 에러 핸들러 중 하나로, 에러 발생 시 컨테이너(Kafka 리스너)를 중단시켜 재시작이나 alert 처리 등 외부 조치를 취할 수 있게 하는 역할 수행

<br>

### `consumerRef`, `containerRef`

```java
var consumerRef  = new AtomicReference<Consumer<?, ?>>();
var containerRef = new AtomicReference<MessageListenerContainer>();
```

- 에러 핸들링 중에 `Kafka Consumer`와 `MessageListenerContainer` 객체에 접근할 수 있도록 참조를 저장
- **왜 필요하냐면**, 내부에서 전달받은 `consumer`, `container`를 `CommonContainerStoppingErrorHandler`로 넘겨줘야 하는데, 이건 `handleRemaining()` 내부에서만 접근 가능하므로 중간 저장소처럼 쓰임

<br>

### `DefaultErrorHandler` 생성

```java
var errorhandler = new DefaultErrorHandler(
		(record, exception) -> cseh.handleRemaining(
				exception, 
				Collections.singletonList(record), 
				consumerRef.get(), 
				containerRef.get()
		), generatedBackOff())
```

- Spring Kafka의 기본 `DefaultErrorHandler`를 확장
- 첫 번째 인자는 `BiConsumer<ConsumerRecord, Exception>` 형태의 **레코드 단위 처리 핸들러**입니다. 여기서 `CommonContainerStoppingErrorHandler`의 `handleRemaining`을 호출하여 에러 처리를 위임
- `generatedBackOff()`는 재시도 로직을 설정(예: 몇 번 재시도할지, 지연 시간 등).

<br>

### `handleRemaining()` 오버라이드

```java
@Override
public void handleRemaining(
		Exception thrownException, 
		List<ConsumerRecord<?, ?>> records,
		Consumer<?, ?> consumer, 
		MessageListenerContainer container
) {
    consumerRef.set(consumer);
    containerRef.set(container);
    super.handleRemaining(thrownException, records, consumer, container);
}
```

- `DefaultErrorHandler`의 `handleRemaining()` 메서드를 오버라이드해서, `consumer`와 `container`를 `AtomicReference`에 저장
- 이렇게 저장해두면 위에서 `record, exception -> ...` 콜백 내에서 참조해서 사용 가능

<br>

### 재시도 예외 제외 처리

```java
errorhandler.addNotRetryableExceptions(IllegalArgumentException.class);
```

- `IllegalArgumentException`이 발생한 경우에는 **재시도 없이 바로 처리**(예: 컨테이너 중단 등)되도록 설정