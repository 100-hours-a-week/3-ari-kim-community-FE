const API_BASE_URL = 'http://localhost:8080/api';

// HTML 문서가 모두 로드되면 실행
document.addEventListener('DOMContentLoaded', () => {

    // localStorage에서 userId를 가져옴
    const currentUserId = parseInt(localStorage.getItem('userId'), 10);

    // DOM 요소
    const postTitle = document.getElementById('post-title');
    const postAuthor = document.getElementById('post-author');
    const postDate = document.getElementById('post-date');
    const postActions = document.getElementById('post-actions');
    const editPostBtn = document.getElementById('edit-post-btn');
    const deletePostBtn = document.getElementById('delete-post-btn');
    const postContent = document.getElementById('post-content');

    const likeButton = document.getElementById('like-button');
    const likeCount = document.getElementById('like-count');
    const viewCount = document.getElementById('view-count');
    const commentCount = document.getElementById('comment-count');

    const commentForm = document.getElementById('comment-form');
    const commentTextarea = document.getElementById('comment-textarea');
    const commentSubmitBtn = document.getElementById('comment-submit-btn');
    const commentListContainer = document.getElementById('comment-list');

    const deletePostModal = document.getElementById('delete-post-modal');
    const cancelPostDelete = document.getElementById('cancel-post-delete');
    const confirmPostDelete = document.getElementById('confirm-post-delete');
    
    const deleteCommentModal = document.getElementById('delete-comment-modal');
    const cancelCommentDelete = document.getElementById('cancel-comment-delete');
    const confirmCommentDelete = document.getElementById('confirm-comment-delete');

    let postId = null; // 현재 게시물 ID
    let isEditingCommentId = null; // 수정 중인 댓글 ID
    

    // --- 헬퍼 함수 ---

    // 숫자 포맷팅
    function formatNumber(num) {
        if (num >= 1000) {
            return (num / 1000).toFixed(0) + 'k';
        }  
        return num;
    }

    // --- 데이터 로드 및 렌더링 ---

    async function fetchPostDetails(id) {
        console.log(`[API] ID: ${id} 게시글 데이터 불러오는 중...`);
        try {
            // API 호출 (GET /api/posts/{postId})
            const response = await fetch(`${API_BASE_URL}/posts/${id}`);
            const apiResponse = await response.json(); 
            if (!response.ok || !apiResponse.success) {
                throw new Error(apiResponse.message || `게시글을 불러올 수 없습니다.`);
            }
            const post = apiResponse.data; 
            return post;

        } catch (error) {
            console.error('fetchPostDetails 오류:', error);
            alert(error.message);
            window.location.href = '/posts'; 
            return null;
        }
    }
    
    // 게시글 내용 렌더링
    function renderPost(post) {
        postTitle.textContent = post.title;
        postAuthor.textContent = post.nickname; 
        postDate.textContent = new Date(post.createdAt).toLocaleString(); 
        postContent.textContent = post.content;
        
        if (postImage && post.imageUrl) {
            postImage.src = post.imageUrl;
            postImage.style.display = 'block'; 
        } else if (postImage) {
            postImage.style.display = 'none'; 
        }

        if(likeCount) likeCount.textContent = formatNumber(post.likeCount);
        if(viewCount) viewCount.textContent = formatNumber(post.viewCount);
        if(commentCount) commentCount.textContent = formatNumber(post.commentCount);
        
        // (가정) GetPostDetailResponse DTO에 "user": { "userId": ... } 구조 포함
        if (post.user && post.user.userId === currentUserId) {
            postActions.style.display = 'flex';
        }
    }

    /*
    // 댓글 목록 렌더링
    function renderComments(comments) {
        commentListContainer.innerHTML = ''; // 기존 댓글 비우기
        commentCount.textContent = formatNumber(comments.length); // 댓글 수 업데이트

        comments.forEach(comment => {
            const commentElement = createCommentElement(comment);
            commentListContainer.appendChild(commentElement);
        });
    }

    // 개별 댓글 HTML 요소 생성
    function createCommentElement(comment) {
        const div = document.createElement('div');
        div.className = 'comment-item';
        div.dataset.commentId = comment.id; // DOM에 ID 저장

        // 본인 댓글일 때만 수정/삭제 버튼 추가
        const actionsHTML = comment.author.id === currentUserId ? `
            <div class="comment-actions">
                <button class="text-button comment-edit-btn">수정</button>
                <button class="text-button comment-delete-btn">삭제</button>
            </div>
        ` : '';

        div.innerHTML = `
            <div class="comment-header">
                <div class="post-author-info">
                    <div class="author-avatar"></div>
                    <span class="author-name">${comment.author.name}</span>
                    <span class="post-date">${new Date(comment.date).toLocaleString()}</span>
                </div>
                ${actionsHTML}
            </div>
            <p class="comment-content">${comment.content}</p>
        `;

        // 생성된 버튼에 이벤트 리스너 바로 연결
        const editBtn = div.querySelector('.comment-edit-btn');
        const deleteBtn = div.querySelector('.comment-delete-btn');

        if (editBtn) {
            editBtn.addEventListener('click', () => handleEditComment(comment));
        }
        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => showDeleteCommentModal(comment.id));
        }
        
        return div;
    }


    // --- 이벤트 핸들러 및 로직 ---

    // 좋아요 버튼 업데이트 함수
    function updateLikeButton(isLiked, count) {
        likeButton.dataset.liked = isLiked;
        likeCount.textContent = formatNumber(count);
        if (isLiked) {
            likeButton.classList.add('liked'); // 'liked' 클래스로 활성화 (ACA0EB)
            likeButton.classList.remove('unliked'); // 'unliked' 클래스 제거 (D9D9D9)
        } else {
            likeButton.classList.add('unliked');
            likeButton.classList.remove('liked');
        }
    }

    // 좋아요 버튼 클릭
    likeButton.addEventListener('click', () => {
        let isLiked = likeButton.dataset.liked === 'true';
        let currentLikes = parseInt(likeCount.textContent.replace('k', '') * 1000) || parseInt(likeCount.textContent);
        
        // (가상) 좋아요 API 호출
        // fetch(`/api/posts/${postId}/like`, { method: isLiked ? 'DELETE' : 'POST' })
        
        // 테스트용 로직
        isLiked = !isLiked;
        const newLikeCount = isLiked ? currentLikes + 1 : currentLikes - 1;
        updateLikeButton(isLiked, newLikeCount);
    });

    // 댓글 입력창 활성화
    commentTextarea.addEventListener('input', () => {
        commentSubmitBtn.disabled = commentTextarea.value.trim().length === 0;
    });

    // 댓글 폼 제출 (등록 또는 수정)
    commentForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const content = commentTextarea.value.trim();
        if (content.length === 0) return;

        if (isEditingCommentId) {
            // 댓글 수정 모드
            // (가상) fetch(`/api/comments/${isEditingCommentId}`, { method: 'PUT', ... })
            
            // DOM 업데이트
            const commentElement = document.querySelector(`.comment-item[data-comment-id="${isEditingCommentId}"]`);
            if (commentElement) {
                commentElement.querySelector('.comment-content').textContent = content;
            }
            alert('댓글이 수정되었습니다.');

            // 수정 모드 종료
            isEditingCommentId = null;
            commentSubmitBtn.textContent = '댓글 등록';

        } else {
            // 새 댓글 등록 모드
            // (가상) fetch(`/api/posts/${postId}/comments`, { method: 'POST', ... })
            
            // (가상) 서버 응답 데이터
            const newComment = {
                id: Math.floor(Math.random() * 1000),
                author: { id: currentUserId, name: '나(테스트)' },
                date: new Date().toISOString(),
                content: content
            };

            // DOM에 새 댓글 추가
            const newCommentElement = createCommentElement(newComment);
            commentListContainer.appendChild(newCommentElement);
            commentCount.textContent = formatNumber(commentListContainer.children.length);
        }

        // 폼 초기화
        commentTextarea.value = '';
        commentSubmitBtn.disabled = true;
    });

    // 댓글 수정 버튼 클릭
    function handleEditComment(comment) {
        isEditingCommentId = comment.id;
        commentTextarea.value = comment.content;
        commentSubmitBtn.textContent = '댓글 수정';
        commentSubmitBtn.disabled = false;
        commentTextarea.focus(); // 텍스트 영역으로 포커스
    }*/


    // --- 모달 관련 로직 ---
    
    // 게시글 삭제 모달 보이기
    deletePostBtn.addEventListener('click', async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/posts/${postId}`, { 
                method: 'DELETE' 
            });
    
            if (!response.ok) { 
                throw new Error('게시글 삭제에 실패했습니다.');
            }
    
            alert('게시글이 삭제되었습니다.');
            window.location.href = '/posts'; 
    
        } catch (error) {
            console.error('게시글 삭제 오류:', error);
            alert(error.message);
            deletePostModal.classList.add('modal-hidden'); 
    }
});
    // 게시글 삭제 - 취소
    cancelPostDelete.addEventListener('click', () => {
        deletePostModal.classList.add('modal-hidden');
    });

    /*
    // 댓글 삭제 모달 보이기
    function showDeleteCommentModal(commentId) {
        // 모달에 삭제할 댓글 ID 저장
        deleteCommentModal.dataset.commentId = commentId;
        deleteCommentModal.classList.remove('modal-hidden');
    }
    // 댓글 삭제 - 확인
    confirmCommentDelete.addEventListener('click', () => {
        const commentId = deleteCommentModal.dataset.commentId;
        // (가상) fetch(`/api/comments/${commentId}`, { method: 'DELETE' })
        
        // DOM에서 댓글 삭제
        document.querySelector(`.comment-item[data-comment-id="${commentId}"]`).remove();
        commentCount.textContent = formatNumber(commentListContainer.children.length);
        deleteCommentModal.classList.add('modal-hidden');
        alert('댓글이 삭제되었습니다.');
    });
    // 댓글 삭제 - 취소
    cancelCommentDelete.addEventListener('click', () => {
        deleteCommentModal.classList.add('modal-hidden');
    });
*/

    // --- 페이지 초기화 ---
    async function initPage() {
        // URL에서 게시글 ID 가져오기
        const urlParams = new URLSearchParams(window.location.search);
        postId = urlParams.get('id');
        
        if (!postId) {
            alert('게시글 ID가 없습니다.');
            window.location.href = '/posts';
            return;
        }
        if (!currentUserId) {
            alert('로그인이 필요합니다.');
            window.location.href = '/login'; 
            return;
        }

        // 데이터 로드 및 렌더링
        const post = await fetchPostDetails(postId); // 수정된 함수 호출

        if (post) { 
            renderPost(post);
            
            editPostBtn.addEventListener('click', () => {
                window.location.href = `/posts/${postId}/edit`; 
            });
        }
    }

    initPage(); // 페이지 시작
});