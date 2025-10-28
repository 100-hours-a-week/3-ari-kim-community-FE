//import { showToast } from '../../utils/toast.js';

document.addEventListener('DOMContentLoaded', () => {

    // --- DOM 요소 ---
    const postForm = document.getElementById('post-update-form');
    const postTitle = document.getElementById('post-title');
    const postContent = document.getElementById('post-content');
    const existingImageName = document.getElementById('existing-image-name');
    const postImage = document.getElementById('post-image');
    const submitButton = document.getElementById('submit-button');
    const titleHelper = document.getElementById('title-helper');

    let imageFile = null; // 새로 업로드할 이미지 파일
    let postId = null; // 수정할 게시글 ID

    // --- 버튼 활성화 로직 ---
    function updateButtonState() {
        const title = postTitle.value.trim();
        const content = postContent.value.trim();
        
        // 제목과 본문이 모두 채워지면 버튼 활성화
        submitButton.disabled = !(title.length > 0 && content.length > 0);
    }

    // --- 기존 게시글 데이터 불러오기 ---
    async function fetchPostData(id) {
        const response = await fetch(`/api/posts/${id}`);
        if (!response.ok) throw new Error('게시글을 불러올 수 없습니다.');
        return await response.json();
    }

    // --- 폼에 기존 데이터 채우기 ---
    async function populateForm() {
        // URL에서 게시글 ID 가져오기
        const urlParams = new URLSearchParams(window.location.search);
        postId = urlParams.get('id');
        
        if (!postId) {
            alert('잘못된 접근입니다.');
            window.location.href = '../postList/PostListPage.html';
            return;
        }

        try {
            const data = await fetchPostData(postId);
            postTitle.value = data.title;
            postContent.value = data.content;
            if (data.imageName) {
                existingImageName.textContent = data.imageName;
            }
            
            // 데이터 로드 후 버튼 상태 즉시 업데이트
            updateButtonState();

        } catch (error) {
            alert(error.message);
            window.location.href = '../postList/PostListPage.html';
        }
    }

    // --- 이벤트 리스너 ---
    
    // 실시간 유효성 검사 및 버튼 활성화
    postTitle.addEventListener('input', updateButtonState);
    postContent.addEventListener('input', updateButtonState);

    // 새 이미지 파일 저장
    postImage.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            imageFile = file;
            // (수정) 새 파일 선택 시 "기존 파일" 텍스트 대신 새 파일명 표시
            existingImageName.textContent = `(새 파일) ${file.name}`;
        }
    });

    // 폼 제출 (수정) 로직
    postForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        
        const title = postTitle.value.trim();
        const content = postContent.value.trim();

        if (title.length === 0 || content.length === 0) {
            titleHelper.textContent = "*제목, 내용을 모두 작성해주세요";
            return;
        }

        // FormData 객체 생성
        const formData = new FormData();
        formData.append('title', title);
        formData.append('content', content);
        if (imageFile) { // 새 이미지가 선택된 경우에만 추가
            formData.append('image', imageFile);
        }

        // 서버 API 호출 (PUT 또는 PATCH 메서드 사용)
        try {
            const response = await fetch(`/api/posts/${postId}`, {
                method: 'PUT', // 또는 'PATCH'
                body: formData
                // headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('수정에 실패했습니다.');

            // 수정 성공 시, 해당 게시글의 상세 페이지로 이동
            setTimeout(() => {
                window.location.href = `../postDetail/PostDetailPage.html?id=${postId}`;
            }, 1000); // 1초 후 이동 (토스트 확인 시간)

        } catch (error) {
            console.error('게시글 수정 중 오류:', error);
            alert('게시글 수정 중 오류가 발생했습니다.');
        }
    });

    // --- 페이지 초기화 실행 ---
    populateForm();
});