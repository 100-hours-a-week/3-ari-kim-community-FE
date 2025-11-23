// Lambda API Gateway 엔드포인트
const LAMBDA_API_URL = 'https://vkxvpl28kl.execute-api.ap-northeast-2.amazonaws.com';

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

        const lambdaResponse = await fetch(LAMBDA_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                fileName: fileName,
                fileType: fileType
            })
        });

        if (!lambdaResponse.ok) {
            const errorData = await lambdaResponse.json();
            throw new Error(errorData.error || 'Pre-signed URL 발급 실패');
        }

        const lambdaData = await lambdaResponse.json();
        const uploadURL = lambdaData.uploadURL;

        // 2. Pre-signed URL로 S3에 직접 업로드
        const s3Response = await fetch(uploadURL, {
            method: 'PUT',
            headers: {
                'Content-Type': fileType,
            },
            body: file
        });

        if (!s3Response.ok) {
            throw new Error('S3 업로드 실패');
        }

        // 3. S3 URL 반환 (Lambda에서 받은 fileName을 기반으로)
        const s3Url = `https://rarely-s3-bucket.s3.ap-northeast-2.amazonaws.com/${fileName}`;
        return s3Url;

    } catch (error) {
        console.error('S3 업로드 중 오류:', error);
        throw error;
    }
}

/**
 * S3에서 파일을 삭제합니다.
 * @param {string} s3Url - 삭제할 파일의 S3 URL
 */
export async function deleteFileFromS3(s3Url) {
    try {
        // S3 URL에서 key 추출
        // https://rarely-s3-bucket.s3.ap-northeast-2.amazonaws.com/folder/file.jpg
        // -> folder/file.jpg
        const urlParts = s3Url.split('.amazonaws.com/');
        if (urlParts.length < 2) {
            throw new Error('잘못된 S3 URL 형식');
        }
        const key = urlParts[1];

        // Lambda에 DELETE 요청
        const response = await fetch(`${LAMBDA_API_URL}?key=${encodeURIComponent(key)}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || '파일 삭제 실패');
        }

        return true;
    } catch (error) {
        console.error('S3 파일 삭제 중 오류:', error);
        throw error;
    }
}

