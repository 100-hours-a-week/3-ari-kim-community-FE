// HTML 문서가 모두 로드되면 실행
document.addEventListener('DOMContentLoaded', () => {

    // --- 1. 전역 변수 및 DOM 요소 ---
    
    // (가정) 현재 로그인한 사용자 ID (테스트용)
    const currentUserId = 1; 

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
    
    // --- 2. 헬퍼 함수 ---

    // 숫자 포맷팅
    function formatNumber(num) {
        if (num >= 1000) {
            return (num / 1000).toFixed(0) + 'k';
        }  
        return num;
    }

    // --- 데이터 로드 및 렌더링 ---

    // (가상) 서버에서 게시글 상세 데이터 가져오기 (테스트용)
    async function fetchPostDetails(id) {
        console.log(`[테스트 모드] ID: ${id} 게시글 데이터 불러오는 중...`);
        await new Promise(resolve => setTimeout(resolve, 500));
        
        return {
            post: {
                id: id,
                title: `테스트 게시글 ${id}`,
                content: `게시글 ${id}의 본문입니다. \n\nLorem ipsum dolor sit amet, consectetur adipiscing elit. \nPraesent interdum felis ac elit ultrices, in tincidunt libero...`,
                date: '2025-10-21 14:30:00',
                likes: 1230,
                views: 15000,
                author: { id: 1, name: '테스트작성자1' }, 
                is_modified: 0,
                likedByMe: true // 내가 좋아요 눌렀는지 여부
            },
            comments: [
                { id: 101, author: { id: 2, name: '유저2' }, date: '2025-10-21 15:00:00', content: '첫 번째 댓글입니다.' },
                { id: 102, author: { id: 1, name: '테스트작성자1' }, date: '2025-10-21 15:05:00', content: '두 번째 댓글입니다. (내 댓글)' },
                { id: 103, author: { id: 3, name: '유저3' }, date: '2025-10-21 15:10:00', content: '세 번째 댓글입니다.' },
            ]
        };
    }
    
    // 게시글 내용 렌더링
    function renderPost(post) {
        postTitle.textContent = post.title;
        postAuthor.textContent = post.author.name;
        postDate.textContent = new Date(post.date).toLocaleString();
        postContent.textContent = post.content;
        
        likeCount.textContent = formatNumber(post.likes);
        viewCount.textContent = formatNumber(post.views);
        
        //  좋아요 버튼 상태 설정
        updateLikeButton(post.likedByMe, post.likes);

        // 본인 글일 때만 수정/삭제 버튼 표시
        if (post.author.id === currentUserId) {
            postActions.style.display = 'flex';
        }
    }

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
    }

    // --- 모달 관련 로직 ---
    
    // 게시글 삭제 모달 보이기
    deletePostBtn.addEventListener('click', () => {
        deletePostModal.classList.remove('modal-hidden');
    });
    // 게시글 삭제 - 확인
    confirmPostDelete.addEventListener('click', () => {
        // (가상) fetch(`/api/posts/${postId}`, { method: 'DELETE' })
        alert('게시글이 삭제되었습니다.');
        window.location.href = 'PostListPage.html'; // 목록으로 이동
    });
    // 게시글 삭제 - 취소
    cancelPostDelete.addEventListener('click', () => {
        deletePostModal.classList.add('modal-hidden');
    });

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

    // --- 5. 페이지 초기화 ---
    async function initPage() {
        // 1. URL에서 게시글 ID 가져오기
        const urlParams = new URLSearchParams(window.location.search);
        postId = urlParams.get('id');
        
        if (!postId) {
            alert('게시글 ID가 없습니다.');
            window.location.href = '../postList/PostListPage.html';
            return;
        }

        // 2. 데이터 로드 및 렌더링
        const data = await fetchPostDetails(postId);
        renderPost(data.post);
        renderComments(data.comments);
        
        // 수정 버튼에 ID 연결
        editPostBtn.addEventListener('click', () => {
            window.location.href = `../postUpdate/PostUpdatePage.html?id=${postId}`;
        });
    }

    initPage(); // 페이지 시작
});