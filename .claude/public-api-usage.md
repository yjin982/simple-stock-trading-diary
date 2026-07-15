# 공공 api 사용법

## 1. 금융위원회\_KRX상장종목정보

### 1. API 개요

| API명 (영문)            | API명 (국문)                | API 설명                                                                                                                                                                                                                                                                                                                                                                        |
| ----------------------- | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| GetKrxListedInfoService | 금융위원회\_KRX상장종목정보 | 한국 거래소에서 제공하는 KRX에 상장된 종목에 대한 정보로, 상장된 종목의 종목명, 법인명, ISIN코드 등을 종목 정보 오퍼레이션으로 제공한다.※ 외국회사의 경우 국내법인번호를 제공하지 않습니다. ※ 외국회사는 대한민국 외의 국가에서 설립되어 해당 국가의 법령에 따라 등록, 운영되는 법인을 의미하며, 국내에 별도의 법인등록을 하지 않은 경우 국내 법인등록번호가 존재하지 않습니다. |

### 2. 상세 기능 명세

#### 1. 상세 기능 정보

|                    |                                                                             |
| ------------------ | --------------------------------------------------------------------------- |
| 상세기능 번호      | 1                                                                           |
| 상세기능 유형      | 조회 (목록)                                                                 |
| 상세기능명(국문)   | 종목 정보                                                                   |
| 상세기능 설명      | KRX에 상장된 종목에 대한 정보조회 기능                                      |
| Call Back URL      | https://apis.data.go.kr/1160100/service/GetKrxListedInfoService/getItemInfo |
| 최대 메시지 사이즈 | [4000] byte                                                                 |
| 평균 응답 시간     | [500] ms                                                                    |
| 초당 최대 트랙잭션 | [30] tps                                                                    |

#### 2. 요청 메세지 명세

| 항목명(영문) | 항목명(국문)      | 항목크기 | 항목구분 | 샘플데이터                     | 항목설명                                        |
| ------------ | ----------------- | -------- | -------- | ------------------------------ | ----------------------------------------------- |
| numOfRows    | 한 페이지 결과 수 | 4        | 0        | 1                              | 한 페이지 결과 수                               |
| pageNo       | 페이지 번호       | 4        | 0        | 1                              | 페이지 번호                                     |
| resultType   | 결과형식          | 4        | 0        | xml                            | 구분(xml, json) Default: xml                    |
| serviceKey   | 서비스키          | 400      | 1        | 공공데이터포털에서 받은 인증키 | 공공데이터포털에서 받은 인증키                  |
| basDt        | 기준일자          | 8        | 0        | 20220919                       | 검색값과 기준일자가 일치하는 데이터를 검색      |
| beginBasDt   | 기준일자          | 8        | 0        | 20220919                       | 기준일자가 검색값보다 크거나 같은 데이터를 검색 |
| endBasDt     | 기준일자          | 8        | 0        | 20220920                       | 기준일자가 검색값보다 작은 데이터를 검색        |
| likeBasDt    | 기준일자          | 8        | 0        | 20220919                       | 기준일자값이 검색값을 포함하는 데이터를 검색    |
| likeSrtnCd   | 단축코드          | 9        | 0        | A000020                        | 단축코드가 검색값을 포함하는 데이터를 검색      |
| isinCd       | ISIN코드          | 12       | 0        | KR7000020008                   | 검색값과 ISIN코드가 일치하는 데이터를 검색      |
| likeIsinCd   | ISIN코드          | 12       | 0        | KR7000020008                   | ISIN코드가 검색값을 포함하는 데이터를 검색      |
| itmsNm       | 종목명            | 240      | 0        | 동화약품                       | 검색값과 종목명이 일치하는 데이터를 검색        |
| likeItmsNm   | 종목명            | 240      | 0        | 동화약품                       | 종목명이 검색값을 포함하는 데이터를 검색        |
| crno         | 법인등록번호      | 20       | 0        | 1101110043870                  | 검색값과 법인등록번호가 일치하는 데이터를 검색  |
| corpNm       | 법인명            | 240      | 0        | 동화약품(주)                   | 검색값과 법인명이 일치하는 데이터를 검색        |
| likeCorpNm   | 법인명            | 240      | 0        | 동화약품(주)                   | 법인명이 검색값을 포함하는 데이터를 검색        |

#### 3. 응답 메세지 명세

| 항목명(영문) | 항목명(국문)      | 항목크기 | 항목구분 | 샘플데이터      | 항목설명                                                                    |
| ------------ | ----------------- | -------- | -------- | --------------- | --------------------------------------------------------------------------- |
| resultCode   | 결과코드          | 2        | 1        | 00              | 결과코드                                                                    |
| resultMsg    | 결과메시지        | 50       | 1        | NORMAL SERVICE. | 결과메시지                                                                  |
| numOfRows    | 한 페이지 결과 수 | 4        | 1        | 1               | 한 페이지 결과 수                                                           |
| pageNo       | 페이지 번호       | 4        | 1        | 1               | 페이지 번호                                                                 |
| totalCount   | 전체 결과 수      | 10       | 1        | 1617195         | 전체 결과 수                                                                |
| basDt        | 기준일자          | 8        | 0        | 20220919        | YYYYMMDD 조회의 기준일, 통상 거래일                                         |
| srtnCd       | 단축코드          | 9        | 0        | A000020         | 종목코드보다 짧으면서 유일성이 보장되는 코드                                |
| isinCd       | ISIN코드          | 12       | 0        | KR7000020008    | 국제 채권 식별번호. 유가증권(채권)의 국제인증 고유번호                      |
| mrktCtg      | 시장 구분         | 10       | 0        | KOSPI           | 시장 구분 (KOSPI/KOSDAQ/KONEX 등)                                           |
| itmsNm       | 종목명            | 240      | 0        | 동화약품        | 유가증권 국제인증 고유번호 코드 이름                                        |
| crno         | 법인등록번호      | 20       | 0        | 1101110043870   | 종목의 법인등록번호※ 외국회사의 경우 국내 법인등록번호를 제공하지 않습니다. |
| corpNm       | 법인명            | 240      | 0        | 동화약품(주)    | 종목의 법인 명칭                                                            |

#### 4. 요청/응답 메시지 예제

- 요청메시지

```
https://apis.data.go.kr/1160100/service/GetKrxListedInfoService/getItemInfo?serviceKey=인증키&numOfRows=1&pageNo=1&resultType=xml
```

- 응답 메세지

```
"
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<response>
    <header>
        <resultCode>00</resultCode>
        <resultMsg>NORMAL SERVICE.</resultMsg>
    </header>
    <body>
        <numOfRows>1</numOfRows>
        <pageNo>1</pageNo>
        <totalCount>1617195</totalCount>
        <items>
            <item>
                <basDt>20220919</basDt>
                <srtnCd>A000020</srtnCd>
                <isinCd>KR7000020008</isinCd>
                <mrktCtg>KOSPI</mrktCtg>
                <itmsNm>동화약품</itmsNm>
                <crno>1101110043870</crno>
                <corpNm>동화약품(주)</corpNm>
            </item>
        </items>
    </body>
</response>"
```

## 2. 에러 코드

| 에러코드 | 에러메시지                                       | 설명                               |
| -------- | ------------------------------------------------ | ---------------------------------- |
| 1        | APPLICATION_ERROR                                | 어플리케이션 에러                  |
| 10       | INVALID_REQUEST_PARAMETER_ERROR                  | 잘못된 요청 파라미터 에러          |
| 12       | NO_OPENAPI_SERVICE_ERROR                         | 해당 오픈API서비스가 없거나 폐기됨 |
| 20       | SERVICE_ACCESS_DENIED_ERROR                      | 서비스 접근거부                    |
| 22       | LIMITED_NUMBER_OF_SERVICE_REQUESTS_EXCEEDS_ERROR | 서비스 요청제한횟수 초과에러       |
| 30       | SERVICE_KEY_IS_NOT_REGISTERED_ERROR              | 등록되지 않은 서비스키             |
| 31       | DEADLINE_HAS_EXPIRED_ERROR                       | 기한만료된 서비스키                |
| 32       | UNREGISTERED_IP_ERROR                            | 등록되지 않은 IP                   |
| 99       | UNKNOWN_ERROR                                    | 기타에러                           |

## 2. KRX Open Api: 유가증권 종목기본정보

### 1. 설명

유가증권 종목기본정보 ('10년01월04일 데이터부터 제공)

Server endpoint url : https://data-dbg.krx.co.kr/svc/apis/sto/stk_isu_base_info

### 2. 요청/응답 상세

#### 1.request

InBlock_1

| Name  | Type   | Description |
| ----- | ------ | ----------- |
| basDd | string | 기준일자    |

#### 3. request Sample

```
{"basDd":"__"}
```

#### 4. response

OutBlock_1

| Name               | Type   | Description   |
| ------------------ | ------ | ------------- |
| ISU_CD             | string | 표준코드      |
| ISU_SRT_CD         | string | 단축코드      |
| ISU_NM             | string | 한글 종목명   |
| ISU_ABBRV          | string | 한글 종목약명 |
| ISU_ENG_NM         | string | 영문 종목명   |
| LIST_DD            | string | 상장일        |
| MKT_TP_NM          | string | 시장구분      |
| SECUGRP_NM         | string | 증권구분      |
| SECT_TP_NM         | string | 소속부        |
| KIND_STKCERT_TP_NM | string | 주식종류      |
| PARVAL             | string | 액면가        |
| LIST_SHRS          | string | 상장주식수    |

#### 5. response Sample

```
{"OutBlock_1":[{"ISU_CD":"__","ISU_SRT_CD":"__","ISU_NM":"__","ISU_ABBRV":"__","ISU_ENG_NM":"__","LIST_DD":"__","MKT_TP_NM":"__","SECUGRP_NM":"__","SECT_TP_NM":"-","KIND_STKCERT_TP_NM":"__","PARVAL":"__","LIST_SHRS":"__"},{"ISU_CD":"__","ISU_SRT_CD":"__","ISU_NM":"__","ISU_ABBRV":"__","ISU_ENG_NM":"__","LIST_DD":"__","MKT_TP_NM":"__","SECUGRP_NM":"__","SECT_TP_NM":"-","KIND_STKCERT_TP_NM":"__","PARVAL":"__","LIST_SHRS":"__"}]}
```

## 3. KRX Open Api: 유가증권 일별매매정보

### 1. 설명

유가증권시장에 상장되어 있는 주권의 매매정보 제공 ('10년01월04일 데이터부터 제공)

Server endpoint url : https://data-dbg.krx.co.kr/svc/apis/sto/stk_bydd_trd

### 2. 요청/응답 상세

#### 1.request

InBlock_1

| Name  | Type   | Description |
| ----- | ------ | ----------- |
| basDd | string | 기준일자    |

#### 3. request Sample

```
{"basDd":"__"}
```

#### 4. response

OutBlock_1

| Name          | Type   | Description |
| ------------- | ------ | ----------- |
| BAS_DD        | string | 기준일자    |
| ISU_CD        | string | 종목코드    |
| ISU_NM        | string | 종목명      |
| MKT_NM        | string | 시장구분    |
| SECT_TP_NM    | string | 소속부      |
| TDD_CLSPRC    | string | 종가        |
| CMPPREVDD_PRC | string | 대비        |
| FLUC_RT       | string | 등락률      |
| TDD_OPNPRC    | string | 시가        |
| TDD_HGPRC     | string | 고가        |
| TDD_LWPRC     | string | 저가        |
| ACC_TRDVOL    | string | 거래량      |
| ACC_TRDVAL    | string | 거래대금    |
| MKTCAP        | string | 시가총액    |
| LIST_SHRS     | string | 상장주식수  |

#### 5. response Sample

```
{"OutBlock_1":[{"BAS_DD":"__","ISU_CD":"__","ISU_NM":"__","MKT_NM":"__","SECT_TP_NM":"-","TDD_CLSPRC":"-","CMPPREVDD_PRC":"-","FLUC_RT":"-","TDD_OPNPRC":"-","TDD_HGPRC":"-","TDD_LWPRC":"-","ACC_TRDVOL":"-","ACC_TRDVAL":"-","MKTCAP":"-","LIST_SHRS":"-"},{"BAS_DD":"__","ISU_CD":"__","ISU_NM":"__","MKT_NM":"__","SECT_TP_NM":"-","TDD_CLSPRC":"-","CMPPREVDD_PRC":"-","FLUC_RT":"-","TDD_OPNPRC":"-","TDD_HGPRC":"-","TDD_LWPRC":"-","ACC_TRDVOL":"-","ACC_TRDVAL":"-","MKTCAP":"-","LIST_SHRS":"-"}]}
```

## 2. KRX Open Api: 코스닥 종목기본정보

### 1. 설명

코스닥 종목기본정보 ('10년01월04일 데이터부터 제공)

Server endpoint url : https://data-dbg.krx.co.kr/svc/apis/sto/ksq_isu_base_info

### 2. 요청/응답 상세

#### 1.request

InBlock_1

| Name  | Type   | Description |
| ----- | ------ | ----------- |
| basDd | string | 기준일자    |

#### 3. request Sample

```
{"basDd":"__"}
```

#### 4. response

OutBlock_1

| Name               | Type   | Description   |
| ------------------ | ------ | ------------- |
| ISU_CD             | string | 표준코드      |
| ISU_SRT_CD         | string | 단축코드      |
| ISU_NM             | string | 한글 종목명   |
| ISU_ABBRV          | string | 한글 종목약명 |
| ISU_ENG_NM         | string | 영문 종목명   |
| LIST_DD            | string | 상장일        |
| MKT_TP_NM          | string | 시장구분      |
| SECUGRP_NM         | string | 증권구분      |
| SECT_TP_NM         | string | 소속부        |
| KIND_STKCERT_TP_NM | string | 주식종류      |
| PARVAL             | string | 액면가        |
| LIST_SHRS          | string | 상장주식수    |

#### 5. response Sample

```
{"OutBlock_1":[{"ISU_CD":"__","ISU_SRT_CD":"__","ISU_NM":"__","ISU_ABBRV":"__","ISU_ENG_NM":"__","LIST_DD":"__","MKT_TP_NM":"__","SECUGRP_NM":"__","SECT_TP_NM":"-","KIND_STKCERT_TP_NM":"__","PARVAL":"__","LIST_SHRS":"__"},{"ISU_CD":"__","ISU_SRT_CD":"__","ISU_NM":"__","ISU_ABBRV":"__","ISU_ENG_NM":"__","LIST_DD":"__","MKT_TP_NM":"__","SECUGRP_NM":"__","SECT_TP_NM":"-","KIND_STKCERT_TP_NM":"__","PARVAL":"__","LIST_SHRS":"__"}]}
```

## 2. KRX Open Api: 코스닥 일별매매정보

### 1. 설명

코스닥시장에 상장되어 있는 주권의 매매정보 제공 ('10년01월04일 데이터부터 제공)

Server endpoint url : https://data-dbg.krx.co.kr/svc/apis/sto/ksq_bydd_trd

### 2. 요청/응답 상세

#### 1.request

InBlock_1

| Name  | Type   | Description |
| ----- | ------ | ----------- |
| basDd | string | 기준일자    |

#### 3. request Sample

```
{"basDd":"__"}
```

#### 4. response

OutBlock_1

| Name          | Type   | Description |
| ------------- | ------ | ----------- |
| BAS_DD        | string | 기준일자    |
| ISU_CD        | string | 종목코드    |
| ISU_NM        | string | 종목명      |
| MKT_NM        | string | 시장구분    |
| SECT_TP_NM    | string | 소속부      |
| TDD_CLSPRC    | string | 종가        |
| CMPPREVDD_PRC | string | 대비        |
| FLUC_RT       | string | 등락률      |
| TDD_OPNPRC    | string | 시가        |
| TDD_HGPRC     | string | 고가        |
| TDD_LWPRC     | string | 저가        |
| ACC_TRDVOL    | string | 거래량      |
| ACC_TRDVAL    | string | 거래대금    |
| MKTCAP        | string | 시가총액    |
| LIST_SHRS     | string | 상장주식수  |

#### 5. response Sample

```
{"OutBlock_1":[{"BAS_DD":"__","ISU_CD":"__","ISU_NM":"__","MKT_NM":"__","SECT_TP_NM":"-","TDD_CLSPRC":"-","CMPPREVDD_PRC":"-","FLUC_RT":"-","TDD_OPNPRC":"-","TDD_HGPRC":"-","TDD_LWPRC":"-","ACC_TRDVOL":"-","ACC_TRDVAL":"-","MKTCAP":"-","LIST_SHRS":"-"},{"BAS_DD":"__","ISU_CD":"__","ISU_NM":"__","MKT_NM":"__","SECT_TP_NM":"-","TDD_CLSPRC":"-","CMPPREVDD_PRC":"-","FLUC_RT":"-","TDD_OPNPRC":"-","TDD_HGPRC":"-","TDD_LWPRC":"-","ACC_TRDVOL":"-","ACC_TRDVAL":"-","MKTCAP":"-","LIST_SHRS":"-"}]}
```
