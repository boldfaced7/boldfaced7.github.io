---
layout: single
title: "4. Application 레벨에서 CDC를 구현할 그 외 방법"
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
# 지금까지 다뤘던 방법

- 애플리케이션 레벨에서 CDC를 구현하기 위해 이전에 논의했던 다양한 접근 방식
- 각 방법의 장단점과 적용 시나리오를 고려한 구현



![Application 레벨 CDC 구현 방법](/assets/images/Kafka/Kafka와 메시징 큐/CDC(Change Data Capture)/14-Application 레벨에서 CDC를 구현할 그 외 방법/image34.jpg)

<br>

# Application 레벨에서 대체 구현한 CDC의 한계점

## 메시지 누락 가능성

- DB에 데이터가 확실히 반영된 후에 Kafka로 메시지를 프로듀스하려고 할 때, 프로듀스 과정에서 네트워크 문제나 Kafka 브로커의 일시적인 장애로 인해 메시지가 누락될 수 있는 위험

<br>

## 데이터 정합성 불일치

- Kafka로 먼저 메시지를 프로듀스한 후에 DB에 데이터를 반영하려고 할 때, DB 반영이 실패하면 Kafka에는 이미 변경 사항이 유통되어 데이터 정합성이 깨질 수 있는 문제

<br>

# 한계가 발생하는 근본적인 이유

## 데이터 흐름의 병렬성 (Dual Write)

- 데이터 변경 사항을 DB와 Kafka라는 두 개의 독립적인 시스템에 동시에 기록해야 하는 이중 쓰기(Dual Write) 구조

<br>

## 단일 트랜잭션의 부재

- DB에 대한 작업과 Kafka에 대한 메시지 전송 작업을 하나의 원자적인 트랜잭션으로 묶을 수 없는 제약

<br>

# 방법 (1) 직렬로 바꿔보기

- 병렬적인 데이터 흐름을 직렬적인 흐름으로 변경하여 데이터 정합성을 확보하려는 시도



![직렬 데이터 흐름](/assets/images/Kafka/Kafka와 메시징 큐/CDC(Change Data Capture)/14-Application 레벨에서 CDC를 구현할 그 외 방법/image36.jpg)
- 데이터 변경 사항이 DB에 먼저 기록된 후, 그 결과를 기반으로 Kafka 메시지를 전송하는 직렬적인 데이터 흐름
- DB 커밋이 완료된 후에만 Kafka 메시지가 발행되므로, DB와 Kafka 간의 정합성을 높이는 데 기여



# 방법 (2) 아웃박스 패턴

- 데이터 정합성을 보장하기 위한 효과적인 패턴 중 하나로, Outbox 테이블을 활용하는 방식



![아웃박스 패턴](/assets/images/Kafka/Kafka와 메시징 큐/CDC(Change Data Capture)/14-Application 레벨에서 CDC를 구현할 그 외 방법/image37.jpg)
- 애플리케이션은 비즈니스 데이터와 함께 Kafka로 전송할 메시지를 Outbox 테이블에 저장
- 별도의 트랜잭션 코디네이터 또는 폴링 프로세스가 Outbox 테이블을 모니터링하여 메시지를 Kafka로 전송
- 이 패턴은 DB 트랜잭션과 메시지 전송의 원자성을 보장하여 데이터 유실이나 불일치를 방지하는 데 매우 효과적인 방법