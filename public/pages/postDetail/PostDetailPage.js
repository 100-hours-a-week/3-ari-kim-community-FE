import { API_BASE_URL } from '../../utils/config.js';
import { showToast } from '../../utils/toast.js';

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
    const postImage = document.getElementById('post-image');

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
    
    // 댓글 인피니티 스크롤링 관련 변수
    let currentCommentCursorId = null;
    let isLoadingComments = false;
    let hasMoreComments = true;
    let isFirstCommentLoad = true;

    // --- 헬퍼 함수 ---

    // 숫자 포맷팅
    function formatNumber(num) {
        if (num >= 1000) {
            return (num / 1000).toFixed(0) + 'k';
        }  
        return num;
    }
    
    // 한국 시간으로 포맷팅
    function formatKoreanDateTime(dateString) {
        const date = new Date(dateString);
        // UTC 시간을 한국 시간으로 변환 (UTC+9)
        const koreaTime = new Date(date.getTime() + (9 * 60 * 60 * 1000));
        return koreaTime.toLocaleString('ko-KR', { 
            timeZone: 'Asia/Seoul',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    // --- 데이터 로드 및 렌더링 ---

    async function fetchPostDetails(id) {
        console.log(`[API] ID: ${id} 게시글 데이터 불러오는 중...`);
        try {
            const accessToken = localStorage.getItem('accessToken');
            
            // 로그인하지 않은 경우
            if (!accessToken) {
                throw new Error('로그인이 필요합니다.');
            }
            
            // API 호출 (GET /api/posts/{postId}) - JWT 토큰 포함
            const response = await fetch(`${API_BASE_URL}/posts/${id}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`
                }
            });
            
            let apiResponse = null;
            try {
                const responseText = await response.text();
                if (responseText) {
                    apiResponse = JSON.parse(responseText);
                }
            } catch (parseError) {
                throw new Error('서버 응답을 읽을 수 없습니다.');
            }
            
            // 403 Forbidden 또는 401 Unauthorized 오류 처리
            if (response.status === 403 || response.status === 401) {
                alert('로그인이 만료되었습니다. 다시 로그인해주세요.');
                localStorage.clear();
                window.location.href = '/login';
                return null;
            }
            
            if (!response.ok || !apiResponse || (apiResponse.status !== 200 && response.status !== 200)) {
                throw new Error(apiResponse?.message || `게시글을 불러올 수 없습니다.`);
            }
            const post = apiResponse.data; 
            return post;

        } catch (error) {
            console.error('fetchPostDetails 오류:', error);
            if (error.message === '로그인이 필요합니다.') {
                alert('로그인이 필요한 서비스입니다.');
                window.location.href = '/login';
            } else {
                alert(error.message);
                window.location.href = '/posts';
            }
            return null;
        }
    }
    
    // 게시글 내용 렌더링
    function renderPost(post) {
        postTitle.textContent = post.title;
        postAuthor.textContent = post.nickname; 
        // 한국 시간으로 변환하여 표시
        const createdDate = formatKoreanDateTime(post.createdAt);
        const modifiedTag = post.isModified ? ' (수정됨)' : '';
        postDate.textContent = createdDate + modifiedTag;
        postContent.textContent = post.content;
        
        // 작성자 프로필 이미지 표시
        const authorAvatar = document.querySelector('.post-author-info .author-avatar');
        if (authorAvatar && post.profileUrl && post.profileUrl.trim() !== '') {
            authorAvatar.style.backgroundImage = `url(${post.profileUrl})`;
            authorAvatar.style.backgroundSize = 'cover';
            authorAvatar.style.backgroundPosition = 'center';
            authorAvatar.style.backgroundColor = 'transparent';
        } else if (authorAvatar) {
            authorAvatar.style.backgroundImage = 'none';
            authorAvatar.style.backgroundColor = '#e9ecef';
        }
        
        // 게시물 이미지 표시
        if (postImage) {
            if (post.imageUrl && post.imageUrl.trim() !== '') {
                // 원본 이미지 비율 유지를 위해 img 태그 사용
                const img = new Image();
                img.onload = function() {
                    // 기존 background-image 방식 대신 img 태그로 교체
                    postImage.innerHTML = '';
                    const displayImg = document.createElement('img');
                    displayImg.src = post.imageUrl;
                    displayImg.style.width = '100%';
                    displayImg.style.height = 'auto';
                    displayImg.style.borderRadius = '8px';
                    displayImg.style.display = 'block';
                    postImage.appendChild(displayImg);
                    postImage.style.display = 'block';
                };
                img.onerror = function() {
                    console.error('게시물 이미지 로드 실패:', post.imageUrl);
                    postImage.style.display = 'none';
                };
                img.src = post.imageUrl;
            } else {
                postImage.style.display = 'none';
            }
        }

        // 통계 정보 표시 (BigInteger 처리)
        if(likeCount) {
            likeCount.textContent = formatNumber(post.likeCount || 0);
        }
        if(viewCount) {
            // BigInteger를 숫자로 변환
            const viewCountValue = post.viewCount ? (typeof post.viewCount === 'string' ? parseInt(post.viewCount, 10) : Number(post.viewCount)) : 0;
            viewCount.textContent = formatNumber(viewCountValue);
        }
        if(commentCount) commentCount.textContent = formatNumber(post.commentCount || 0);
        
        // 작성자 확인 (userId로 비교)
        if (post.userId === currentUserId) {
            postActions.style.display = 'flex';
        } else {
            postActions.style.display = 'none';
        }
    }

    // 댓글 목록 불러오기
    async function fetchComments(postId, cursorId, size = 10) {
        isLoadingComments = true;
        const commentLoader = document.getElementById('comment-loader');
        
        // 첫 페이지 로드일 때만 로더 표시
        if (isFirstCommentLoad && commentLoader) {
            commentLoader.style.display = 'block';
        }
        
        try {
            const accessToken = localStorage.getItem('accessToken');
            // API URL 구성 (상대 경로 사용)
            let url = `${API_BASE_URL}/posts/${postId}/comments?size=${size}`;
            if (cursorId) {
                url += `&cursorId=${cursorId}`;
            }
            
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': accessToken ? `Bearer ${accessToken}` : ''
                }
            });
            
            let apiResponse = null;
            try {
                const responseText = await response.text();
                if (responseText) {
                    apiResponse = JSON.parse(responseText);
                }
            } catch (parseError) {
                throw new Error('서버 응답을 읽을 수 없습니다.');
            }
            
            if (response.ok && apiResponse && (apiResponse.status === 200 || response.status === 200)) {
                const slice = apiResponse.data;
                const comments = slice && slice.content ? slice.content : [];
                
                // 첫 페이지 로드 완료 후 처리
                if (isFirstCommentLoad) {
                    isFirstCommentLoad = false;
                    // 로더는 observer 설정 함수에서 처리하므로 여기서 숨기지 않음
                }
                
                // 다음 페이지 여부 확인
                hasMoreComments = slice ? !slice.last : false;
                
                // 더 이상 로드할 게 없으면 메시지 표시 (observer 설정 함수에서 처리)
                // 여기서는 로더를 숨기지 않음
                
                // 다음 요청에 사용할 커서 ID 업데이트
                if (comments.length > 0) {
                    currentCommentCursorId = comments[comments.length - 1].commentId;
                }
                
                return comments;
            } else {
                throw new Error(apiResponse?.message || '댓글을 불러올 수 없습니다.');
            }
        } catch (error) {
            console.error('댓글 목록 불러오기 오류:', error);
            if (commentLoader) {
                commentLoader.style.display = 'none';
            }
            hasMoreComments = false;
            return [];
        } finally {
            isLoadingComments = false;
        }
    }

    // 댓글 목록 렌더링 (추가 모드)
    function renderComments(comments, isAppend = false) {
        if (!commentListContainer) return;
        
        // 첫 로드 시에만 초기화
        if (!isAppend) {
            commentListContainer.innerHTML = '';
        }
        
        // 댓글이 없고 첫 로드일 때만 메시지 표시
        if (comments.length === 0 && !isAppend) {
            commentListContainer.innerHTML = '<p style="text-align: center; color: #868e96; padding: 20px;">댓글이 없습니다.</p>';
            return;
        }

        comments.forEach(comment => {
            const commentElement = createCommentElement(comment);
            commentListContainer.appendChild(commentElement);
        });
    }
    
    // 추가 댓글 로드
    async function loadMoreComments() {
        if (!postId || isLoadingComments || !hasMoreComments) return;
        
        const comments = await fetchComments(postId, currentCommentCursorId, 10);
        if (comments.length > 0) {
            renderComments(comments, true);
        }
        
        // 마지막 댓글인 경우 메시지 표시
        const commentLoader = document.getElementById('comment-loader');
        if (!hasMoreComments && commentLoader) {
            commentLoader.style.display = 'block';
            commentLoader.innerHTML = '<p style="text-align: center; color: #868e96; padding: 20px;">마지막 댓글입니다</p>';
        }
    }
    
    // 댓글 observer 설정 함수
    function setupCommentObserver() {
        const commentLoader = document.getElementById('comment-loader');
        if (!commentLoader) return;
        
        // 기존 observer 제거 (있다면)
        if (window.commentObserver) {
            window.commentObserver.disconnect();
        }
        
        if (!hasMoreComments) {
            // 첫 로드에서 이미 모든 댓글을 가져온 경우
            commentLoader.style.display = 'block';
            commentLoader.innerHTML = '<p style="text-align: center; color: #868e96; padding: 20px;">마지막 댓글입니다</p>';
        } else {
            // 추가 댓글이 있는 경우 observer 설정
            commentLoader.innerHTML = '<p>loading...</p>'; // 로더 텍스트 초기화
            commentLoader.style.display = 'block'; // observer가 작동하려면 보여야 함
            
            const commentObserver = new IntersectionObserver((entries) => {
                if (entries[0].isIntersecting && !isLoadingComments && hasMoreComments && !isFirstCommentLoad) {
                    commentLoader.style.display = 'block';
                    commentLoader.innerHTML = '<p>loading...</p>'; // 로더 텍스트 복원
                    loadMoreComments();
                }
            }, {
                threshold: 0.1 // 더 빠른 로딩을 위해 10% 보이면 실행
            });
            commentObserver.observe(commentLoader);
            window.commentObserver = commentObserver; // 전역으로 저장하여 나중에 disconnect 가능하게
        }
    }

    // 개별 댓글 HTML 요소 생성
    function createCommentElement(comment) {
        const div = document.createElement('div');
        div.className = 'comment-item';
        div.dataset.commentId = comment.commentId;

        // 본인 댓글일 때만 수정/삭제 버튼 추가
        const isOwnComment = comment.nickname === localStorage.getItem('userNickname');
        const actionsHTML = isOwnComment ? `
            <div class="comment-actions">
                <button class="text-button comment-edit-btn">수정</button>
                <button class="text-button comment-delete-btn">삭제</button>
            </div>
        ` : '';

        const modifiedTag = comment.isModified ? '<span class="modified-tag">(수정됨)</span>' : '';

        div.innerHTML = `
            <div class="comment-header">
                <div class="post-author-info">
                    <div class="author-avatar"></div>
                    <span class="author-name">${comment.nickname}</span>
                    <span class="post-date">${formatKoreanDateTime(comment.createAt)}</span>
                    ${modifiedTag}
                </div>
                ${actionsHTML}
            </div>
            <p class="comment-content">${comment.content}</p>
        `;

        // 작성자 프로필 이미지 표시
        const authorAvatar = div.querySelector('.author-avatar');
        if (authorAvatar && comment.profileUrl && comment.profileUrl.trim() !== '') {
            authorAvatar.style.backgroundImage = `url(${comment.profileUrl})`;
            authorAvatar.style.backgroundSize = 'cover';
            authorAvatar.style.backgroundPosition = 'center';
            authorAvatar.style.backgroundColor = 'transparent';
        } else if (authorAvatar) {
            authorAvatar.style.backgroundImage = 'none';
            authorAvatar.style.backgroundColor = '#e9ecef';
        }

        // 생성된 버튼에 이벤트 리스너 연결
        const editBtn = div.querySelector('.comment-edit-btn');
        const deleteBtn = div.querySelector('.comment-delete-btn');

        if (editBtn) {
            editBtn.addEventListener('click', () => handleEditComment(comment));
        }
        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => showDeleteCommentModal(comment.commentId));
        }
        
        return div;
    }

    // 댓글 수정 버튼 클릭
    function handleEditComment(comment) {
        isEditingCommentId = comment.commentId;
        commentTextarea.value = comment.content;
        commentSubmitBtn.textContent = '댓글 수정';
        commentSubmitBtn.disabled = false;
        commentTextarea.focus();
    }

    // 댓글 삭제 모달 보이기
    function showDeleteCommentModal(commentId) {
        if (!deleteCommentModal) return;
        deleteCommentModal.dataset.commentId = commentId;
        deleteCommentModal.classList.remove('modal-hidden');
    }

    // --- 이벤트 핸들러 및 로직 ---

    // 좋아요 버튼 업데이트 함수 (전역 스코프로 이동)
    window.updateLikeButton = function(isLiked, count) {
        if (!likeButton) return;
        likeButton.dataset.liked = isLiked;
        if (likeCount) likeCount.textContent = formatNumber(count);
        if (isLiked) {
            likeButton.classList.add('liked'); // 'liked' 클래스로 활성화 (보라색 #ACA0EB)
            likeButton.classList.remove('unliked'); // 'unliked' 클래스 제거
        } else {
            likeButton.classList.add('unliked'); // 'unliked' 클래스로 비활성화 (회색 #D9D9D9)
            likeButton.classList.remove('liked');
        }
    };
    
    // 로컬 함수도 유지 (하위 호환성)
    const updateLikeButton = window.updateLikeButton;

    // 좋아요 버튼 클릭 이벤트 리스너 등록
    if (likeButton) {
        likeButton.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            
        if (!postId || !currentUserId) {
            return;
        }
        
        const accessToken = localStorage.getItem('accessToken');
        if (!accessToken) {
            alert('로그인이 필요합니다.');
            window.location.href = '/login';
            return;
        }
        
        try {
            // 좋아요 토글 API 호출 (POST)
            const response = await fetch(`${API_BASE_URL}/posts/${postId}/likes/${currentUserId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`
                }
            });
            
            let data = null;
            try {
                const responseText = await response.text();
                if (responseText) {
                    data = JSON.parse(responseText);
                }
            } catch (parseError) {
                throw new Error('서버 응답을 읽을 수 없습니다.');
            }
            
            if (response.ok && data && (data.status === 200 || response.status === 200)) {
                const isLiked = data.data;
                
                // 게시물 정보 다시 불러와서 좋아요 수 업데이트
                const updatedPost = await fetchPostDetails(postId);
                if (updatedPost) {
                    if (window.updateLikeButton) {
                        window.updateLikeButton(isLiked, updatedPost.likeCount || 0);
                    } else if (typeof updateLikeButton === 'function') {
                        updateLikeButton(isLiked, updatedPost.likeCount || 0);
                    }
                }
            } else {
                alert('좋아요 처리에 실패했습니다.');
            }
        } catch (error) {
            console.error('좋아요 처리 오류:', error);
            alert('좋아요 처리 중 오류가 발생했습니다.');
        }
        });
    }

    // 댓글 입력창 활성화 (초기화 시점에 등록)
    // 주의: initPage에서도 재등록하므로 중복 방지를 위해 한 번만 등록
    if (commentTextarea && commentSubmitBtn) {
        // 초기 상태 설정
        commentSubmitBtn.disabled = true;
        
        commentTextarea.addEventListener('input', () => {
            const hasContent = commentTextarea.value.trim().length > 0;
            commentSubmitBtn.disabled = !hasContent;
        });
    }

    // 댓글 폼 제출 (등록 또는 수정)
    if (commentForm) {
        commentForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            if (!postId || !currentUserId) return;
            
            const content = commentTextarea.value.trim();
            if (content.length === 0) return;

            const accessToken = localStorage.getItem('accessToken');
            if (!accessToken) {
                alert('로그인이 필요합니다.');
                window.location.href = '/login';
                return;
            }

            if (isEditingCommentId) {
                // 댓글 수정 모드
                try {
                    const response = await fetch(`${API_BASE_URL}/posts/${postId}/comments/${isEditingCommentId}`, {
                        method: 'PATCH',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${accessToken}`
                        },
                        body: JSON.stringify({
                            userId: currentUserId,
                            content: content
                        })
                    });
                    
                    let data = null;
                    try {
                        const responseText = await response.text();
                        if (responseText) {
                            data = JSON.parse(responseText);
                        }
                    } catch (parseError) {
                        throw new Error('서버 응답을 읽을 수 없습니다.');
                    }
                    
                    if (response.ok && data && (data.status === 200 || response.status === 200)) {
                        // 수정 모드 종료
                        isEditingCommentId = null;
                        commentSubmitBtn.textContent = '댓글 등록';
                        commentTextarea.value = '';
                        commentSubmitBtn.disabled = true;
                        
                        // 댓글 목록 다시 불러오기 (초기화)
                        currentCommentCursorId = null;
                        hasMoreComments = true;
                        isFirstCommentLoad = true;
                        const comments = await fetchComments(postId, null, 10);
                        renderComments(comments, false);
                        setupCommentObserver(); // observer 재설정
                        
                        showToast('댓글이 수정되었습니다.');
                    } else {
                        alert('댓글 수정에 실패했습니다.');
                    }
                } catch (error) {
                    console.error('댓글 수정 오류:', error);
                    alert('댓글 수정 중 오류가 발생했습니다.');
                }


            } else {
                // 새 댓글 등록 모드
                try {
                    const response = await fetch(`${API_BASE_URL}/posts/${postId}/comments`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${accessToken}`
                        },
                        body: JSON.stringify({
                            userId: currentUserId,
                            content: content
                        })
                    });
                    
                    let data = null;
                    try {
                        const responseText = await response.text();
                        if (responseText) {
                            data = JSON.parse(responseText);
                        }
                    } catch (parseError) {
                        throw new Error('서버 응답을 읽을 수 없습니다.');
                    }
                    
                    if (response.ok && data && (data.status === 200 || response.status === 200)) {
                        // 폼 초기화
                        commentTextarea.value = '';
                        commentSubmitBtn.disabled = true;
                        
                        // 댓글 목록 다시 불러오기 (초기화)
                        currentCommentCursorId = null;
                        hasMoreComments = true;
                        isFirstCommentLoad = true;
                        const comments = await fetchComments(postId, null, 10);
                        renderComments(comments, false);
                        setupCommentObserver(); // observer 재설정
                        
                        // 댓글 수 업데이트는 게시물 정보에서 가져옴
                        const updatedPost = await fetchPostDetails(postId);
                        if (updatedPost && commentCount) {
                            commentCount.textContent = formatNumber(updatedPost.commentCount || 0);
                        }
                    } else {
                        alert('댓글 등록에 실패했습니다.');
                    }
                } catch (error) {
                    console.error('댓글 등록 오류:', error);
                    alert('댓글 등록 중 오류가 발생했습니다.');
                }
            }
        });
    }


    // --- 모달 관련 로직 ---
    
    // 게시글 삭제 버튼 클릭
    if (deletePostBtn) {
        deletePostBtn.addEventListener('click', () => {
            deletePostModal.classList.remove('modal-hidden');
        });
    }
    
    // 게시글 삭제 확인
    if (confirmPostDelete) {
        confirmPostDelete.addEventListener('click', async () => {
            if (!postId) return;
            
            const accessToken = localStorage.getItem('accessToken');
            if (!accessToken) {
                alert('로그인이 필요합니다.');
                window.location.href = '/login';
                return;
            }
            
            try {
                const response = await fetch(`${API_BASE_URL}/posts/${postId}`, { 
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${accessToken}`
                    }
                });
        
                if (!response.ok) {
                    if (response.status === 403 || response.status === 401) {
                        alert('로그인이 만료되었습니다. 다시 로그인해주세요.');
                        localStorage.clear();
                        window.location.href = '/login';
                        return;
                    }
                    throw new Error('게시글 삭제에 실패했습니다.');
                }
        
                showToast('게시글이 삭제되었습니다.');
                // 토스트 메시지가 표시된 후 페이지 이동
                setTimeout(() => {
                    window.location.href = '/posts';
                }, 500); 
        
            } catch (error) {
                console.error('게시글 삭제 오류:', error);
                alert(error.message);
            } finally {
                deletePostModal.classList.add('modal-hidden');
            }
        });
    }
    // 게시글 삭제 - 취소
    cancelPostDelete.addEventListener('click', () => {
        deletePostModal.classList.add('modal-hidden');
    });

    // 댓글 삭제 - 확인
    if (confirmCommentDelete) {
        confirmCommentDelete.addEventListener('click', async () => {
            if (!deleteCommentModal || !postId) return;
            
            const commentId = deleteCommentModal.dataset.commentId;
            if (!commentId) return;
            
            const accessToken = localStorage.getItem('accessToken');
            if (!accessToken) {
                alert('로그인이 필요합니다.');
                window.location.href = '/login';
                return;
            }
            
            try {
                const response = await fetch(`${API_BASE_URL}/posts/${postId}/comments/${commentId}`, {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${accessToken}`
                    }
                });
                
                if (!response.ok) {
                    if (response.status === 403 || response.status === 401) {
                        alert('로그인이 만료되었습니다. 다시 로그인해주세요.');
                        localStorage.clear();
                        window.location.href = '/login';
                        return;
                    }
                    throw new Error('댓글 삭제에 실패했습니다.');
                }
                
                // 댓글 목록 다시 불러오기 (초기화)
                currentCommentCursorId = null;
                hasMoreComments = true;
                isFirstCommentLoad = true;
                const comments = await fetchComments(postId, null, 10);
                renderComments(comments, false);
                setupCommentObserver(); // observer 재설정
                
                // 댓글 수 업데이트는 게시물 정보에서 가져옴
                const updatedPost = await fetchPostDetails(postId);
                if (updatedPost && commentCount) {
                    commentCount.textContent = formatNumber(updatedPost.commentCount || 0);
                }
                
                deleteCommentModal.classList.add('modal-hidden');
                showToast('댓글이 삭제되었습니다.');
            } catch (error) {
                console.error('댓글 삭제 오류:', error);
                alert(error.message);
            }
        });
    }
    
    // 댓글 삭제 - 취소
    if (cancelCommentDelete) {
        cancelCommentDelete.addEventListener('click', () => {
            if (deleteCommentModal) {
                deleteCommentModal.classList.add('modal-hidden');
            }
        });
    }

    // --- 페이지 초기화 ---
    async function initPage() {
        // URL 경로에서 게시글 ID 가져오기 (/posts/123 -> 123)
        const pathParts = window.location.pathname.split('/');
        const postIdIndex = pathParts.indexOf('posts') + 1;
        postId = postIdIndex > 0 && pathParts[postIdIndex] ? pathParts[postIdIndex] : null;
        
        if (!postId) {
            alert('게시글 ID가 없습니다.');
            window.location.href = '/posts';
            return;
        }
        
        // 로그인 체크
        const accessToken = localStorage.getItem('accessToken');
        if (!accessToken) {
            alert('로그인이 필요한 서비스입니다.');
            window.location.href = '/login';
            return;
        }

        // 데이터 로드 및 렌더링
        const post = await fetchPostDetails(postId); // 수정된 함수 호출

        if (post) { 
            renderPost(post);
            
            // 댓글 목록 첫 로드
            const comments = await fetchComments(postId, null, 10);
            renderComments(comments, false);
            
            // 댓글 인피니티 스크롤링 설정
            setupCommentObserver();
            
            // 좋아요 상태 초기화 (GET 요청으로 조회만 수행, 토글하지 않음)
            const accessToken = localStorage.getItem('accessToken');
            if (accessToken && postId && currentUserId) {
                try {
                    const likeResponse = await fetch(`${API_BASE_URL}/posts/${postId}/likes/${currentUserId}`, {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${accessToken}`
                        }
                    });
                    
                    let likeData = null;
                    try {
                        const responseText = await likeResponse.text();
                        if (responseText) {
                            likeData = JSON.parse(responseText);
                        }
                    } catch (parseError) {
                        // 좋아요 상태 조회 실패는 무시
                    }
                    
                    if (likeResponse.ok && likeData && (likeData.status === 200 || likeResponse.status === 200)) {
                        const isLiked = likeData.data;
                        // updateLikeButton 함수 호출 (전역 함수 사용)
                        if (window.updateLikeButton) {
                            window.updateLikeButton(isLiked, post.likeCount || 0);
                        } else if (typeof updateLikeButton === 'function') {
                            updateLikeButton(isLiked, post.likeCount || 0);
                        }
                    }
                } catch (error) {
                    // 좋아요 상태 조회 실패는 무시
                }
            }
            
            // 댓글 입력창 이벤트 리스너 재등록 (DOM이 완전히 로드된 후)
            if (commentTextarea && commentSubmitBtn) {
                commentTextarea.addEventListener('input', () => {
                    commentSubmitBtn.disabled = commentTextarea.value.trim().length === 0;
                });
            }
            
            if (editPostBtn) {
                editPostBtn.addEventListener('click', () => {
                    window.location.href = `/posts/${postId}/edit`;
                });
            }
        }
    }

    initPage(); // 페이지 시작
});