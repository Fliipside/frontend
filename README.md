# Flipside

React + TypeScript 대시보드는 [flipside-react/README.md](flipside-react/README.md)를 참고하세요.

```bash
cd flipside-react
npm install
npm run dev -- --port 5174
```

## 배포

`.github/workflows/deploy.yml`이 브랜치에 따라 다음을 합니다.

| 시점 | 테스트 (`npm test`) | 이미지 빌드 + 동작 확인 | Docker Hub 게시 | 서버 배포 |
| ---- | ---- | ---- | ---- | ---- |
| `develop`·`main` 대상 PR | O | O | - | - |
| `develop`에 머지(push) | O | O | - | - |
| `main`에 머지(push) | O | O | O | O |

`develop`에서는 ARM64 이미지를 빌드하고 그 이미지가 화면과 지도 데이터를 내주는지까지만 확인하며, 아무것도 게시하지 않습니다. `main`에 합쳐지면 같은 확인을 거친 뒤 이미지를 Docker Hub 비공개 저장소에 `yjs0120/spring-boot-app:flipside-frontend`로 올리고, 서버에 SSH로 접속해 새 이미지로 교체합니다. 앞 단계가 실패하면 뒤 단계는 실행되지 않습니다. `flipside-frontend` 태그 하나만 매번 덮어써 최신 버전만 남깁니다.

저장소 시크릿 (Settings → Secrets and variables → Actions): `SSH_HOST`, `SSH_USER`, `SSH_PRIVATE_KEY`, `DOCKERHUB_USERNAME`, `DOCKERHUB_TOKEN` (backend 저장소와 같은 값).

### 서버 실행

이미지([flipside-react/Dockerfile](flipside-react/Dockerfile))는 앱을 빌드해 nginx로 정적 파일을 내줍니다. 서버에서는 backend compose(`~/flipside`)와 따로, [deploy/docker-compose.yml](deploy/docker-compose.yml)로 `127.0.0.1:3000`에 띄웁니다. 배포 작업이 이 파일을 `~/flipside-frontend/`로 복사하고 `docker compose pull`, `up -d`를 한 뒤 `127.0.0.1:3000`이 응답하는지 확인합니다. 서버에 미리 해 둘 일은 없습니다.

서버의 Nginx(80)가 `/api/`와 `/health`는 backend(8000)로, 나머지는 이 컨테이너(3000)로 넘깁니다. 화면과 API가 같은 주소라 CORS 설정이 필요 없고, 앱은 `/api/v1/...` 상대 경로로 호출합니다.

```bash
cd ~/flipside-frontend
docker logs -f --tail 100 flipside-frontend   # 로그
docker compose ps                             # 상태
docker compose restart                        # 재시작
```

이전 이미지는 태그로 남지 않습니다. 되돌리려면 그 버전을 배포했던 Actions 실행을 다시 실행(Re-run all jobs)합니다.

내 컴퓨터에서 이미지를 확인할 때:

```bash
docker build --platform linux/arm64 -t flipside-frontend:ci flipside-react
FRONTEND_IMAGE=flipside-frontend:ci docker compose -f deploy/docker-compose.yml up -d   # http://127.0.0.1:3000
docker compose -f deploy/docker-compose.yml down
```
