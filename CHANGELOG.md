## 1.1.1

### Improvements
- **requestHeader:** [url load시 request header를 설정하는 로직 추가](https://www.wrike.com/open.htm?id=714516760)
- **refact:** PrintPage함수 내에서 하던 기능들을 각기 다른 함수로 구분화

## 1.1.0

### Improvements
- **Engine:** [Electron 버전 업그레이드. V4.0.4 => V13.1.0](https://www.wrike.com/open.htm?id=707551349)
- **Cookie:** [CookieFile에 path값이 없을 경우, url의 path값 사용하도록 수정](https://www.wrike.com/open.htm?id=665914149)

## 1.0.3

### Improvements
- **Cookie:** [CookieFile의 path를 지정가능하도록 기능 추가](https://www.wrike.com/open.htm?id=665914149)

## 1.0.2

### Buf Fixes
- **Cookie:** CookieFile 없을 시 항상 오류 리턴하던 로직 수정

### Improvements
- **WebRender** [전체 코드 Repackaging 진행](https://www.wrike.com/open.htm?id=652932163)

### New Features

- **Cookie:** [Url load시 WebStorage 초기화 해주는 기능 추가](https://www.wrike.com/open.htm?id=656620960)

## 1.0.1

### New Features

- **Cookie:** [Cookie 설정 기능 추가](https://www.wrike.com/open.htm?id=647545701)
- **Log:** Log 작성 기능 추가

### Improvements

- **Input:** Input 파일 처리 기능 개선

## 1.0.0

### New Features

- **Build:** linux 패키지 스크립트 추가
- **Build:** build 스크립트에 패키지 작업을 모두 수행하도록 변경
- **Jenkins:** Jenkins CI에 등록을 위한 Jenkinsfile 추가

### Improvements

- **WebPage:** [페이지 내의 alert 함수가 사용되지 않도록 변경](https://www.wrike.com/open.htm?id=604736972)


## 0.0.10

### Improvements

- **URL:** [url 파일을 직접 입력받을 수 있도로 개선](https://www.wrike.com/open.htm?id=607476840)


## 0.0.9

### Bug Fixes

- **Margin:** delay가 없을 경우 margin이 적용되지 않는 문제 조치


## 0.0.8

### Bug Fixes

- **WebPage:** [페이지가 리다이렉션 될 때 변환 에러가 발생하는 문제 조치](https://www.wrike.com/open.htm?id=535776127)


## 0.0.7

### Improvements

- **Option:** useage 내용 보강

### New Features

- **Option:** 디버그 모드 활성화하는 옵션 추가 (--debugMode)

## 0.0.6

### Bug Fixes

- **Option:** 페이지 크기 옵션이 적용되지 않는 문제 수정


## 0.0.5

### New Features

- **Option:** 페이지 크기 옵션 추가 (--pageSize)


## 0.0.4

### New Features

- **Option:** 배경화면 출력 옵션 추가 (--printBackground)
- **Option:** 가로 방향 변환 옵션 추가 (--landscape)
- **Option:** header, footer 옵션 추가 (--header, --footer)


## 0.0.3

### Bug Fixes

- **Option:** HTML Document안에 StyleSheets가 비어있는 경우, 지정된 여백 설정이 적용되지 않는 문제 수정
- **Version:** 프로그램에 Version 규칙 추가


## 0.0.2

### New Features

- **Option:** 여백 옵션 추가 (-m, --margin)


## 0.0.1

### Breaking Changes

- **WebRender:** Released the WebRender !!
