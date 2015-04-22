#### 1. Dependency
==미티어 사용을 위해서는 iron-cli 설치가 필수적입니다. 아래 링크로 들어가셔서 사용전 반드시 설치해주세요.==

[iron-cli 다운 및 설치하기](https://github.com/iron-meteor/iron-cli)

- - -

#### 2. Usage
iron-cli 설치 이후에는 directory root에서 `$ iron`으로 실행시키시면 meteor가 돌아갑니다. "http://localhost:3000"에서 접속하실 수 있으며 MongoDB는 3001번 포트에서 돌아가도록 설정되어 있습니다.

- - -

#### 3. Neo4j password

./server/methods.js 파일 안에 neo4j 비밀번호([PASSWORD])를 입력해야 정보에 접근할 수 있습니다.

```
Meteor.neo4j.connectionURL = "http://neo4j:[PASSWORD]@jeegle.io:7474";
```

#### 4. music deeplink 사용을 위한 mysql package 설치

[node-mysql meteor용 패키지 사용: meteor add pcel:mysql](https://atmospherejs.com/pcel/mysql)
[node-mysql](https://github.com/perak/mysql-shadow/)
[위 깃허브의 README.md에 적혀있는 예제와는 달리 createConnection을 했다면, connection.connect();와 connection.end();를 따로 안해주어도 됩니다. (해주면 오류납니다..) ](http://stackoverflow.com/questions/14087924/cannot-enqueue-handshake-after-invoking-quit)
