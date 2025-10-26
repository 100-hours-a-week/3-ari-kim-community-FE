// HTML 문서가 모두 로드되면 실행
document.addEventListener('DOMContentLoaded', () => {

    // --- 1. DOM 요소 ---
    const postForm = document.getElementById('post-create-form');
    const postTitle = document.getElementById('post-title');
    const postContent = document.getElementById('post-content');
    const postImage = document.getElementById('post-image');
    const submitButton = document.getElementById('submit-button');
    const titleHelper = document.getElementById('title-helper');
    const contentHelper = document.getElementById('content-helper');

    let imageFile = null; // 업로드할 이미지 파일

    // --- 버튼 활성화 로직 ---
    function updateButtonState() {
        const title = postTitle.value.trim();
        const content = postContent.value.trim();
        
        // 제목과 본문이 모두 채워지면 버튼 활성화
        if (title.length > 0 && content.length > 0) {
            submitButton.disabled = false;
        } else {
            submitButton.disabled = true;
        }
    }

    // --- 이미지 파일 저장 ---
    postImage.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            imageFile = file;
            // (선택) 이미지 미리보기 로직을 여기에 추가할 수 있습니다.
        }
    });

    // --- 실시간 유효성 검사 및 버튼 활성화 ---
    postTitle.addEventListener('input', updateButtonState);
    postContent.addEventListener('input', updateButtonState);

    // --- 폼 제출 로직 ---
    postForm.addEventListener('submit', async (event) => {
        event.preventDefault(); // 폼 기본 제출(새로고침) 방지

        const title = postTitle.value.trim();
        const content = postContent.value.trim();

        // 제출 시 최종 유효성 검사
        if (title.length === 0 || content.length === 0) {
            titleHelper.textContent = "*제목, 내용을 모두 작성해주세요";
            return;
        } else {
            titleHelper.textContent = "";
        }

        // FormData 객체 생성 (파일 + 텍스트)
        const formData = new FormData();
        formData.append('title', title);
        formData.append('content', content);
        if (imageFile) {
            formData.append('image', imageFile);
        }

        // (가상) 서버 API 호출
        // (참고) 실제 개발 시, 이 로직은 service/post.js 등으로 분리하는 것이 좋습니다.
        try {
            // const response = await fetch('/api/posts', {
            //     method: 'POST',
            //     body: formData
            //     // (참고) 토큰이 필요하면 헤더에 추가
            //     // headers: { 'Authorization': `Bearer ${token}` }
            // });

            // if (response.ok) {
            //     alert('게시글이 성공적으로 등록되었습니다.');
            //     window.location.href = 'PostListPage.html'; // 목록 페이지로 이동
            // } else {
            //     const error = await response.json();
            //     alert(`등록 실패: ${error.message}`);
            // }

            // --- 테스트용 임시 코드 ---
            console.log('서버로 전송될 데이터:', { title, content, imageFile });
            alert('게시글이 성공적으로 등록되었습니다. (테스트)');
            window.location.href = '../postDetail/PostDetailPage.html?id=${post.id}';

        } catch (error) {
            console.error('게시글 등록 중 오류 발생:', error);
            alert('게시글 등록 중 오류가 발생했습니다.');
        }
    });
});