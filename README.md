# Item Simulator

## 📝 프로젝트 소개

본 프로젝트는 Express.js와 Prisma를 사용하여 구현된 아이템 시뮬레이션 API입니다. 사용자 계정, 캐릭터, 아이템, 인벤토리, 장착 등 RPG 게임의 핵심적인 기능들을 모델링하고 API를 통해 관리할 수 있습니다.

## ✨ 주요 기능

*   **사용자 인증:** bcrypt를 이용한 비밀번호 암호화 및 JWT를 통한 사용자 인증 기능을 제공합니다.
*   **캐릭터 관리:** 캐릭터 생성, 정보 조회, 능력치(체력, 공격력) 및 재화(돈) 관리 기능을 제공합니다.
*   **아이템 관리:** 다양한 종류(무기, 방어구, 소모품 등)의 아이템을 생성하고 관리합니다.
*   **인벤토리 시스템:** 캐릭터별로 인벤토리를 생성하고 아이템을 추가하거나 제거할 수 있습니다.
*   **장비 장착 시스템:** 캐릭터는 인벤토리에 있는 아이템을 부위별(머리, 몸, 무기 등)로 장착하거나 해제할 수 있습니다.

## 🛠️ 기술 스택

*   **Backend:** Node.js, Express.js
*   **ORM:** Prisma
*   **Database:** MySQL
*   **Authentication:** JSON Web Token (JWT), bcrypt
*   **Dependencies:**
    *   `@prisma/client`: Prisma 클라이언트
    *   `bcrypt`: 비밀번호 암호화
    *   `cookie-parser`: 쿠키 파싱
    *   `express`: 웹 프레임워크
    *   `jsonwebtoken`: JWT 생성 및 검증
    *   `prisma`: Prisma CLI
*   **Dev Dependencies:**
    *   `dotenv`: 환경변수 관리
    *   `nodemon`: 개발 환경에서 서버 자동 재시작
    *   `prettier`: 코드 포맷터

## 🗂️ 프로젝트 구조

```
.
├── prisma
│   └── schema.prisma       # Prisma 스키마 정의 파일
├── src
│   ├── app.js              # Express 애플리케이션 초기화
│   ├── middleware          # 미들웨어 (인증, 에러 핸들링 등)
│   ├── route               # API 라우터
│   ├── services            # 비즈니스 로직
│   └── utils               # 유틸리티 (Prisma 클라이언트 등)
├── .gitignore
├── package.json
└── README.md
```

## 🚀 시작하기

1.  **저장소 복제:**
    ```bash
    git clone https://github.com/your-username/ItemSimulator.git
    cd ItemSimulator
    ```

2.  **의존성 설치:**
    ```bash
    yarn install
    ```

3.  **Prisma 설정:**
    *   `.env` 파일을 생성하고 `DATABASE_URL` 환경변수를 설정합니다.
        ```
        DATABASE_URL="mysql://user:password@localhost:3306/your-database-name"
        ```
    *   Prisma 클라이언트를 생성합니다.
        ```bash
        npx prisma generate
        ```
    *   데이터베이스에 스키마를 적용합니다.
        ```bash
        npx prisma db push
        ```

4.  **서버 실행:**
    ```bash
    yarn dev
    ```

## 📄 API 명세서

### 🧑‍🤝‍🧑 User

| Method | Endpoint         | Description      |
| ------ | ---------------- | ---------------- |
| POST   | /sign-up         | 회원가입         |
| POST   | /sign-in         | 로그인           |
| GET    | /refresh         | 토큰 재발급      |

### 🧑 Character

| Method | Endpoint                  | Description      |
| ------ | ------------------------- | ---------------- |
| POST   | /character                | 캐릭터 생성      |
| DELETE | /character/:characterId   | 캐릭터 삭제      |
| GET    | /character/:characterId   | 캐릭터 상세 조회 |

### 📦 Item

| Method | Endpoint         | Description      |
| ------ | ---------------- | ---------------- |
| POST   | /item            | 아이템 생성      |
| PATCH  | /item/:itemId    | 아이템 수정      |
| GET    | /item            | 아이템 목록 조회 |
| GET    | /item/:itemId    | 아이템 상세 조회 |

### 💰 Money

| Method | Endpoint               | Description |
| ------ | ---------------------- | ----------- |
| PATCH  | /money/:characterId    | 재화 획득   |

### 🔁 Trade

| Method | Endpoint            | Description |
| ------ | ------------------- | ----------- |
| PATCH  | /buy/:characterId   | 아이템 구매 |
| DELETE | /sell/:characterId  | 아이템 판매 |

### 🎒 Inventory

| Method | Endpoint                 | Description    |
| ------ | ------------------------ | -------------- |
| GET    | /inventory/:characterId  | 인벤토리 조회  |

### ⚔️ Equipment

| Method | Endpoint               | Description    |
| ------ | ---------------------- | -------------- |
| POST   | /equip/:characterId    | 아이템 장착    |
| GET    | /equip/:characterId    | 장착 아이템 조회 |
| DELETE | /equip/:characterId    | 아이템 탈착    |


## 👨‍💻 작성자

*   **yukgeunmu** ([@yukgeunmu](https://github.com/yukgeunmu))
