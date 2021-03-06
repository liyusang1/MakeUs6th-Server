const { flags } = require('regex-email');
const {pool} = require('../../../config/database');
const {logger} = require('../../../config/winston');

const bookstoreDao = require('../dao/bookstoreDao');

//서점 전체조회
exports.getAllBookstore = async function (req, res) {

    //페이징 쿼리스트링으로 받음
    const {page, limit} = req.query;

    if (!/^([0-9]).{0,5}$/.test(page)) 
        return res.json(
            {isSuccess: false, code: 2001, message: "page는 숫자로만 입력을 해야합니다."}
        );
    
    if (!/^([0-9]).{0,5}$/.test(limit)) 
        return res.json(
            {isSuccess: false, code: 2002, message: "limit는 숫자로만 입력을 해야합니다."}
        );
    
    try {
        const pagingParams = [Number(page), Number(limit)];
        const allBookstoreRows = await bookstoreDao.getAllBookstoreInfo(pagingParams)

        if (allBookstoreRows.length >= 0) {
            return res.json(
                {isSuccess: true, code: 1000, message: "조회 성공", result: allBookstoreRows}
            );
        }
        return res.json({isSuccess: true, code: 3000, message: "에러 발생."});
    } catch (err) {
        // await connection.rollback();  ROLLBACK connection.release();
        logger.error(`App - getAllBookstore error\n: ${err.message}`);
        return res
            .status(500)
            .send(`Error: ${err.message}`);
    }
}

//특정 지역 서점 조회
exports.getBookstore = async function (req, res) {

    //페이징 쿼리스트링으로 받음,locationfilter 받음(중복 허용)
    const {page, limit, locationfilter} = req.query;

    //쿼리스트링으로 입력 받은 locationfilter값에 따라 지역 할당
    let location = [];

    if (!/^([0-9]).{0,5}$/.test(page)) 
        return res.json(
            {isSuccess: false, code: 2001, message: "page는 숫자로만 입력을 해야합니다."}
        );
    
    if (!/^([0-9]).{0,5}$/.test(limit)) 
        return res.json(
            {isSuccess: false, code: 2002, message: "limit는 숫자로만 입력을 해야합니다."}
        );
    
    if (!locationfilter) 
        return res.json(
            {isSuccess: false, code: 2003, message: "최소 하나 이상의 locationfilter 값을 입력해 주세요."}
        );
    
    //console.log(locationfilter[0].length); /locationfilter Validation
    if (locationfilter[0].length == 1) {

        if (!/^([가-힣]).{1,8}$/.test(locationfilter)) 
            return res.json(
                {isSuccess: false, code: 2005, message: "locationfilter는 2자 이상 9자 이하의 한글로 구성되어야 합니다."}
            );
        }
    else {
        for (let i = 0; i < locationfilter.length; i++) {

            if (!/^([가-힣]).{1,8}$/.test(locationfilter[i])) {

                return res.json(
                    {isSuccess: false, code: 2004, message: "locationfilter는 2자 이상 9자 이하의 한글로 구성되어야 합니다."}
                );
            }

        }
    }

    //하나인 경우에는 location에 하나만 push, 그렇지 않으면 전부 push
    if (locationfilter[0].length == 1) 
        location.push(locationfilter)
    else {
        for (let i = 0; i < locationfilter.length; i++) 
            location.push(locationfilter[i])
    }

    try {
        const bookstoreInfoParams = [location, Number(page), Number(limit)];
        const specificBookstoreRows = await bookstoreDao.getSpecificBookstoreInfo(
            bookstoreInfoParams
        )

        if (specificBookstoreRows.length >= 0) {
            return res.json(
                {isSuccess: true, code: 1000, message: "조회 성공", result: specificBookstoreRows}
            );
        }
        return res.json({isSuccess: false, code: 3000, message: "에러 발생."});
    } catch (err) {

        logger.error(`App - getBookstore error\n: ${err.message}`);
        return res
            .status(500)
            .send(`Error: ${err.message}`);
    }
}

//서점 상세조회
exports.bookstoreDetail = async function (req, res) {

    //서점 인덱스 path variable로 받음
    const {bookstoreIdx} = req.params;

    //유저인덱스
    const {userIdx} = req.verifiedToken;

    if (!/^([0-9]).{0,10}$/.test(bookstoreIdx)) 
        return res.json(
            {isSuccess: false, code: 2001, message: "bookstoreIdx는 숫자로 입력해야 합니다."}
        );
    
    const bookstoreIdxCheckRows = await bookstoreDao.bookstoreIdxCheck(
        bookstoreIdx
    )
    if (bookstoreIdxCheckRows.length == 0) 
        return res.json(
            {isSuccess: false, code: 3001, message: "해당하는 인덱스의 서점이 존재하지 않습니다."}
        );
    
    try {
        //서점 이미지
        const bookstoreImagesRows = await bookstoreDao.getBookstoreImages(bookstoreIdx)

        //서점 상세 정보
        const bookstoreDetailParams = [userIdx, bookstoreIdx];
        const bookstoreDetailRows = await bookstoreDao.getBookstoreDetail(
            bookstoreDetailParams
        )

        if ((bookstoreImagesRows.length >= 0) && (bookstoreDetailRows.length >= 0)) {
            return res.json({
                isSuccess: true,
                code: 1000,
                message: "서점 조회 성공",
                result: {
                    images: bookstoreImagesRows,
                    bookStoreInfo: bookstoreDetailRows
                }
            });
        }
        return res.json({isSuccess: false, code: 3000, message: "에러 발생."});
    } catch (err) {
        // await connection.rollback();  ROLLBACK connection.release();
        logger.error(`App - bookstoreDetail error\n: ${err.message}`);
        return res
            .status(500)
            .send(`Error: ${err.message}`);
    }
}

//서점 북마크 상태 수정
exports.bookmarkBookstore = async function (req, res) {

    //페이징 쿼리스트링으로 받음
    const {bookstoreIdx} = req.params;

    //유저인덱스
    const {userIdx} = req.verifiedToken;

    if (!/^([0-9]).{0,10}$/.test(bookstoreIdx)) 
        return res.json(
            {isSuccess: false, code: 2001, message: "bookstoreIdx는 숫자로 입력해야 합니다."}
        );
    
    //북마크 하고자 하는 서점이 유효한 서점인지 체크
    const bookstoreIdxCheckRows = await bookstoreDao.bookstoreIdxCheck(
        bookstoreIdx
    )
    if (bookstoreIdxCheckRows.length == 0) 
        return res.json(
            {isSuccess: false, code: 3001, message: "해당하는 인덱스의 서점이 존재하지 않습니다."}
        );
    
    try {

        const bookmarkParams = [userIdx, bookstoreIdx];

        //북마크 DB 체크
        const bookmarkCheckRows = await bookstoreDao.getBookmarkCheck(bookmarkParams)

        //만약 북마크가 등록되어 있지 않다면 북마크를 status값을 1로 DB에 새로 생성
        if (bookmarkCheckRows.length == 0) {

            const postBookmarkRows = await bookstoreDao.postBookmark(bookmarkParams)
            return res.json(
                {isSuccess: true, code: 1000, message: "북마크 생성 완료"}//이미 등록되어 있는 경우라면 북마크 상태값을 0또는 1로 값에 따라 변경
            );
        } else {

            const patchBookmarkRows = await bookstoreDao.patchBookmark(bookmarkParams)

            if (bookmarkCheckRows[0].status == 0) {
                return res.json({isSuccess: true, code: 1001, message: "북마크 ON"});
            } else if (bookmarkCheckRows[0].status == 1) {
                return res.json({isSuccess: true, code: 1002, message: "북마크 OFF"});
            }

        }
        return res.json({isSuccess: false, code: 3000, message: "에러 발생."});

    } catch (err) {
        // await connection.rollback();  ROLLBACK connection.release();
        logger.error(`App - bookmarkBookstore error\n: ${err.message}`);
        return res
            .status(500)
            .send(`Error: ${err.message}`);
    }
}