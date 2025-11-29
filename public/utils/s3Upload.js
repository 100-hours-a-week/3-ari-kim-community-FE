// Lambda Function URL (API Gateway 대신 Function URL 사용)
// Function URL은 CORS를 Lambda 함수 내에서 직접 처리할 수 있습니다
const LAMBDA_FUNCTION_URL = 'https://6a5jvlpiwczltv4oye3i6twcfm0axjzf.lambda-url.ap-northeast-2.on.aws';

/**
 * Lambda를 통해 Pre-signed URL을 받아서 S3에 파일을 업로드하고 S3 URL을 반환합니다.
 * @param {File} file - 업로드할 파일
 * @param {string} folder - S3 폴더 경로 (예: "users", "posts")
 * @returns {Promise<string>} S3 URL
 */
export async function uploadFileToS3(file, folder) {
    try {
        // 1. Lambda에 Pre-signed URL 요청
        const fileName = `${folder}/${Date.now()}_${file.name}`;
        const fileType = file.type || 'image/jpeg';

        console.log('Lambda에 Pre-signed URL 요청:', { fileName, fileType, url: LAMBDA_FUNCTION_URL });

        let lambdaResponse;
        try {
            // Function URL은 경로 기반 라우팅을 지원하지 않으므로 경로 없이 직접 호출
            // Lambda 함수는 HTTP 메서드(POST)로 요청을 구분합니다
            lambdaResponse = await fetch(LAMBDA_FUNCTION_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    fileName: fileName,
                    fileType: fileType
                })
            });
        } catch (fetchError) {
            console.error('Lambda API 호출 실패:', fetchError);
            throw new Error(`Lambda API 연결 실패: ${fetchError.message}`);
        }

        console.log('Lambda 응답 상태:', lambdaResponse.status, lambdaResponse.statusText);

        // 응답 body를 한 번만 읽기 위해 text()로 먼저 읽고, 필요시 JSON 파싱
        const responseText = await lambdaResponse.text();
        
        if (!lambdaResponse.ok) {
            console.error('[S3 업로드] Lambda 오류 응답:', responseText);
            let errorMessage = 'Pre-signed URL 발급 실패';
            
            // JSON 형식인 경우 파싱 시도
            if (responseText && responseText.trim().startsWith('{')) {
                try {
                    const errorData = JSON.parse(responseText);
                    errorMessage = errorData.error || errorData.message || errorData.details || errorMessage;
                } catch (jsonError) {
                    // JSON 파싱 실패 시 원본 텍스트 사용
                    errorMessage = responseText || errorMessage;
                }
            } else if (responseText) {
                errorMessage = responseText;
            } else {
                // 응답이 비어있는 경우 상태 코드 기반 메시지
                if (lambdaResponse.status === 502) {
                    errorMessage = 'Lambda 함수 실행 중 오류가 발생했습니다. (502 Bad Gateway)';
                } else if (lambdaResponse.status === 500) {
                    errorMessage = '서버 오류가 발생했습니다. (500 Internal Server Error)';
                } else {
                    errorMessage = `Pre-signed URL 발급 실패 (${lambdaResponse.status} ${lambdaResponse.statusText})`;
                }
            }
            throw new Error(errorMessage);
        }

        // 성공 응답 파싱
        let lambdaData;
        try {
            lambdaData = JSON.parse(responseText);
        } catch (parseError) {
            console.error('[S3 업로드] Lambda 응답 파싱 실패:', responseText);
            throw new Error(`Lambda 응답 파싱 실패: ${responseText}`);
        }

        const uploadURL = lambdaData.uploadURL;
        if (!uploadURL) {
            console.error('Lambda 응답에 uploadURL이 없음:', lambdaData);
            throw new Error('Pre-signed URL을 받을 수 없습니다.');
        }

        console.log('Pre-signed URL 받음, S3 업로드 시작');

        // 2. Pre-signed URL로 S3에 직접 업로드
        let s3Response;
        try {
            s3Response = await fetch(uploadURL, {
                method: 'PUT',
                headers: {
                    'Content-Type': fileType,
                },
                body: file
            });
        } catch (s3FetchError) {
            console.error('S3 업로드 요청 실패:', s3FetchError);
            throw new Error(`S3 업로드 요청 실패: ${s3FetchError.message}`);
        }

        console.log('S3 업로드 응답 상태:', s3Response.status, s3Response.statusText);

        if (!s3Response.ok) {
            const errorText = await s3Response.text();
            console.error('S3 업로드 실패:', errorText);
            throw new Error(`S3 업로드 실패 (${s3Response.status}): ${errorText}`);
        }

        // 3. S3 URL 반환 (Lambda에서 받은 fileName을 기반으로)
        // 한글 파일명을 포함한 URL을 올바르게 인코딩
        const pathParts = fileName.split('/');
        const encodedPath = pathParts.map(part => {
            if (part && part !== '') {
                return encodeURIComponent(part);
            }
            return part;
        }).join('/');
        const s3Url = `https://rarely-s3-bucket.s3.ap-northeast-2.amazonaws.com/${encodedPath}`;
        console.log('S3 업로드 성공:', s3Url);
        return s3Url;

    } catch (error) {
        console.error('S3 업로드 중 오류:', error);
        // 더 자세한 오류 정보를 포함하여 throw
        if (error.message) {
            throw error;
        } else {
            throw new Error(`S3 업로드 실패: ${error.toString()}`);
        }
    }
}

/**
 * S3에서 파일을 삭제합니다.
 * @param {string} s3Url - 삭제할 파일의 S3 URL
 */
export async function deleteFileFromS3(s3Url) {
    try {
        console.log('[S3 삭제] 원본 URL:', s3Url);
        
        // S3 URL에서 key 추출
        // https://rarely-s3-bucket.s3.ap-northeast-2.amazonaws.com/folder/file.jpg
        // -> folder/file.jpg
        const urlParts = s3Url.split('.amazonaws.com/');
        if (urlParts.length < 2) {
            throw new Error('잘못된 S3 URL 형식');
        }
        
        // URL 디코딩된 key 추출 (한글 파일명 처리)
        let key = urlParts[1];
        try {
            // URL이 이미 인코딩되어 있을 수 있으므로 디코딩 후 재인코딩
            key = decodeURIComponent(key);
        } catch (e) {
            // 디코딩 실패 시 원본 사용
            console.warn('[S3 삭제] URL 디코딩 실패, 원본 사용:', key);
        }
        
        console.log('[S3 삭제] 추출된 key:', key);
        const encodedKey = encodeURIComponent(key);
        console.log('[S3 삭제] 인코딩된 key:', encodedKey);
        
        const deleteUrl = `${LAMBDA_FUNCTION_URL}?key=${encodedKey}`;
        console.log('[S3 삭제] Lambda 요청 URL:', deleteUrl);

        // Lambda에 DELETE 요청
        // Function URL은 경로 기반 라우팅을 지원하지 않으므로 경로 없이 직접 호출
        // Lambda 함수는 HTTP 메서드(DELETE)와 query parameter(key)로 요청을 구분합니다
        const response = await fetch(deleteUrl, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        console.log('[S3 삭제] Lambda 응답 상태:', response.status, response.statusText);

        if (!response.ok) {
            let errorMessage = '파일 삭제 실패';
            try {
                const responseText = await response.text();
                console.error('[S3 삭제] Lambda 오류 응답:', responseText);
                
                // 응답이 비어있지 않고 JSON 형식인 경우에만 파싱 시도
                if (responseText && responseText.trim().startsWith('{')) {
                    try {
                        const errorData = JSON.parse(responseText);
                        errorMessage = errorData.error || errorData.message || errorData.details || errorMessage;
                    } catch (jsonError) {
                        // JSON 파싱 실패 시 원본 텍스트 사용
                        console.warn('[S3 삭제] JSON 파싱 실패, 원본 텍스트 사용:', jsonError);
                        errorMessage = responseText || errorMessage;
                    }
                } else if (responseText) {
                    // JSON이 아닌 경우 원본 텍스트 사용
                    errorMessage = responseText;
                } else {
                    // 응답이 비어있는 경우 상태 코드 기반 메시지
                    if (response.status === 502) {
                        errorMessage = 'Lambda 함수 실행 중 오류가 발생했습니다. (502 Bad Gateway)';
                    } else if (response.status === 500) {
                        errorMessage = '서버 오류가 발생했습니다. (500 Internal Server Error)';
                    } else {
                        errorMessage = `파일 삭제 실패 (${response.status} ${response.statusText})`;
                    }
                }
            } catch (parseError) {
                console.error('[S3 삭제] 응답 처리 실패:', parseError);
                // 파싱 실패 시 상태 코드 기반 메시지
                if (response.status === 502) {
                    errorMessage = 'Lambda 함수 실행 중 오류가 발생했습니다. (502 Bad Gateway)';
                } else {
                    errorMessage = `파일 삭제 실패 (${response.status})`;
                }
            }
            throw new Error(errorMessage);
        }

        console.log('[S3 삭제] 파일 삭제 성공');
        return true;
    } catch (error) {
        console.error('[S3 삭제] S3 파일 삭제 중 오류:', error);
        throw error;
    }
}

