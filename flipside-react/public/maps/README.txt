관계 지도 경계 데이터

원자료: 통계청 통계지리정보서비스(SGIS, https://sgis.kostat.go.kr)
원자료 이용조건: 공공누리 제1유형 (출처표시)
가공: vuski/admdongkor (https://github.com/vuski/admdongkor)
버전: ver20261001 / 2026-10-01
원본 커밋: 3bc00489b76696db864bdbea4b19985cdfa8b403
가공물 라이선스: CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/)
LICENSE-DATA.txt에 원본 출처와 이용조건을 보존했습니다.

Flipside의 추가 가공:
- mapshaper로 경계를 8% 단순화(keep-shapes), 시군구·시도로 병합.
- 북위 36도를 기준으로 한 정거원통 투영을 사용해 SVG 경로로 변환.
- polylabel로 각 영역 내부의 대표점을 계산.
- 16개 시도 / 256개 시군구 / 3,559개 읍면동, 273개 지역 묶음으로 분할.
- 간략화 과정에서 미세한 경계 교차가 남을 수 있으므로 법적 경계 판정에 사용하지 않습니다.

지도는 행정동 단위 탐색용입니다. 법정동·도로명 주소 검색 API나 건물 좌표는 포함하지 않습니다.
명함 주소의 위치 표시는 사용자가 확인한 행정구역의 대표 위치입니다.
재생성: 프로젝트 루트에서 npm run build:maps
