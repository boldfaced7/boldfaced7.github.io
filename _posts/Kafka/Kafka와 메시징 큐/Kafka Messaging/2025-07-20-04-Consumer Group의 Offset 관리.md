---
layout: single
title: "4. Consumer Group의 Offset 관리"
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
- 평소 상태: 모든 메시지를 consume 완료
  
    ![20241122_211104.png](/assets/images/Kafka/Kafka와 메시징 큐/Kafka Messaging/04-Consumer Group의 Offset 관리/20241122_211104.png)
    
- 특정 컨슈머 그룹의 offset을 reset
  
    ![20241122_211109.png](/assets/images/Kafka/Kafka와 메시징 큐/Kafka Messaging/04-Consumer Group의 Offset 관리/20241122_211109.png)
    
    ![20241122_211116.png](/assets/images/Kafka/Kafka와 메시징 큐/Kafka Messaging/04-Consumer Group의 Offset 관리/20241122_211116.png)
    
- 해당 컨슈머 그룹은 lag이 생기게 됨
  
    ![20241122_211122.png](/assets/images/Kafka/Kafka와 메시징 큐/Kafka Messaging/04-Consumer Group의 Offset 관리/20241122_211122.png)
    
- 컨슈머를 다시 띄우면 Consume을 재개
  
    ![20241122_211126.png](/assets/images/Kafka/Kafka와 메시징 큐/Kafka Messaging/04-Consumer Group의 Offset 관리/20241122_211126.png)
    
- Consume이 끝나면 평소 상태로 원복
  
    ![20241122_211131.png](/assets/images/Kafka/Kafka와 메시징 큐/Kafka Messaging/04-Consumer Group의 Offset 관리/20241122_211131.png)
    
- 해당 과정은 파티션 단위로 이루어짐
  
    ![20241122_211150.png](/assets/images/Kafka/Kafka와 메시징 큐/Kafka Messaging/04-Consumer Group의 Offset 관리/20241122_211150.png)