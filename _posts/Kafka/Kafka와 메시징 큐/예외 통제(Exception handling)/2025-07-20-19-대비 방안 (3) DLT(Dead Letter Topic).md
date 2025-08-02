---
layout: single
title: "4. 대비 방안 (3) DLT(Dead Letter Topic)"
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
# 19-대비 방안 (3): DLT(Dead Letter Topic)

- **DLT (Dead Letter Topic)**는 Kafka 컨슈머가 메시지 처리 중 예외가 발생하여 더 이상 처리할 수 없는 메시지들을 별도로 전송하는 전용 토픽
- 메시지 처리 실패 시 무한 재처리 루프에 빠지거나 메시지가 유실되는 것을 방지하는 중요한 메커니즘
- 실패한 메시지들을 격리하여 추후 분석, 수동 처리 또는 재시도 로직을 적용할 수 있는 유연성 제공

<br>

![DLT 개요](/assets/images/Kafka/Kafka와 메시징 큐/예외 통제(Exception handling)/19-대비 방안 (3) DLT(Dead Letter Topic)/20241122_212033.png)
- 일반적인 Kafka 메시지 처리 흐름과 DLT의 역할
- 컨슈머가 메시지를 처리하는 과정에서 예외가 발생하면, 해당 메시지가 DLT로 전송되는 흐름

<br>

![DLT 동작 원리](/assets/images/Kafka/Kafka와 메시징 큐/예외 통제(Exception handling)/19-대비 방안 (3) DLT(Dead Letter Topic)/20241122_212037.png)
- 컨슈머가 메시지를 소비하고 처리 로직을 수행하는 중 오류가 발생하면, Spring Kafka의 `ErrorHandler`가 이를 감지
- `ErrorHandler`는 실패한 메시지를 DLT로 리다이렉션하여 전송하는 역할

<br>

![DLT 메시지 구조](/assets/images/Kafka/Kafka와 메시징 큐/예외 통제(Exception handling)/19-대비 방안 (3) DLT(Dead Letter Topic)/20241122_212048.png)
- DLT로 전송되는 메시지의 구조 예시
- 원본 메시지 외에 예외 정보, 스택 트레이스, 원본 토픽 및 오프셋 등 실패와 관련된 메타데이터가 추가되는 특징
- 이러한 추가 정보는 실패 원인을 분석하고 디버깅하는 데 유용한 자료

<br>

![DLT 설정 예시 1](/assets/images/Kafka/Kafka와 메시징 큐/예외 통제(Exception handling)/19-대비 방안 (3) DLT(Dead Letter Topic)/20241122_212110.png)
- Spring Kafka에서 DLT를 설정하는 코드의 일부
- `DefaultErrorHandler`를 사용하여 특정 예외 발생 시 DLT로 메시지를 보내도록 구성하는 방식
- `DeadLetterPublishingRecoverer`를 통해 DLT로 메시지를 발행하는 로직을 정의하는 부분

<br>

![DLT 설정 예시 2](/assets/images/Kafka/Kafka와 메시징 큐/예외 통제(Exception handling)/19-대비 방안 (3) DLT(Dead Letter Topic)/20241122_212113.png)
- DLT 관련 설정을 추가하는 코드
- `SeekToCurrentErrorHandler`와 함께 `DeadLetterPublishingRecoverer`를 사용하는 구성
- 특정 재시도 횟수 이후에도 메시지 처리가 실패하면 DLT로 메시지를 전송하도록 설정하는 방식

<br>

![DLT 설정 예시 3](/assets/images/Kafka/Kafka와 메시징 큐/예외 통제(Exception handling)/19-대비 방안 (3) DLT(Dead Letter Topic)/20241122_212116.png)
- 이 이미지는 DLT 토픽의 이름 규칙과 관련된 설정을 보여주는 예시
- 원본 토픽 이름에 `-dlt`와 같은 접미사를 붙여 DLT 토픽을 자동으로 생성하도록 구성하는 방식
- DLT 토픽의 파티션 수, 복제 계수 등도 함께 설정하여 안정적인 운영 환경을 구축하는 데 기여