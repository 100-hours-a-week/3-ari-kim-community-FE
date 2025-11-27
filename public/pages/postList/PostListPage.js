const API_BASE_URL = 'http://localhost:8080/api';
import { showToast, showToastAfterRedirect } from '../../utils/toast.js';

document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname === '/posts' || window.location.pathname === '/') { 

        const postListContainer = document.getElementById('post-list');
        const loader = document.getElementById('loader');
        const createPostButton = document.querySelector('.create-post-button');

        let currentCursorId = null; 
        let isLoading = false; 
        let hasMorePosts = true;
        let isFirstLoad = true; // 첫 페이지 로드 여부

        // 숫자 포맷팅 함수 (1000 -> 1k)
        function formatNumber(num) {
            if (num >= 1000) {
                return (num / 1000).toFixed(0) + 'k';
            }  
            return num;
        }

        // 서버에서 게시글 데이터를 가져옴
        async function fetchPosts(cursorId) {
            isLoading = true;
            
            // 첫 페이지 로드일 때만 로더 표시
            if (isFirstLoad) {
                loader.style.display = 'block';
            }

            try {
                const url = new URL(`${API_BASE_URL}/posts`);
                url.searchParams.append('size', '20'); // 컨트롤러의 기본값
                if (cursorId) { // 첫 페이지 로드가 아닐 때만 cursorId 추가
                    url.searchParams.append('cursorId', cursorId);
                }

                const response = await fetch(url);
                
                let apiResponse = null;
                try {
                    const responseText = await response.text();
                    if (responseText) {
                        apiResponse = JSON.parse(responseText);
                    }
                } catch (parseError) {
                    throw new Error('서버 응답을 읽을 수 없습니다.');
                }

                // 성공 응답 체크: response.ok와 data.status === 200 확인
                if (!response.ok || !apiResponse || (apiResponse.status !== 200 && response.status !== 200)) {
                    throw new Error(apiResponse?.message || '서버에서 게시글을 불러오는데 실패했습니다.');
                }

                const slice = apiResponse.data; // slice 객체 (from Spring Data)
                const posts = slice && slice.content ? slice.content : [];    // 실제 게시글 배열 (null 체크)

                // Slice의 'last' 프로퍼티로 다음 페이지 여부 확인
                hasMorePosts = slice ? !slice.last : false;

                // 첫 페이지 로드 완료 후 처리
                if (isFirstLoad) {
                    isFirstLoad = false;
                    
                    // 게시물이 0개일 때 빈 상태 메시지 표시
                    if (posts.length === 0) {
                        loader.style.display = 'none'; // 로딩 완료 시 로더 숨김
                        const emptyMessage = document.createElement('div');
                        emptyMessage.className = 'empty-message';
                        emptyMessage.style.textAlign = 'center';
                        emptyMessage.style.padding = '40px 20px';
                        emptyMessage.style.color = '#868e96';
                        emptyMessage.style.fontSize = '16px';
                        emptyMessage.textContent = '아직 나눈 이야기가 없어요!';
                        postListContainer.appendChild(emptyMessage);
                    } else {
                        // 게시물이 있으면 로더 숨김 (추가 로드 시 다시 표시됨)
                        loader.style.display = 'none';
                    }
                }
                
                // 더 이상 로드할 게 없으면 로더 숨김
                if (!hasMorePosts) {
                    loader.style.display = 'none';
                }   
                
                // 다음 요청에 사용할 '커서 ID' 업데이트
                if (posts.length > 0) {
                    // (가정) GetPostListResponse DTO에 postId 필드가 있다고 가정
                    currentCursorId = posts[posts.length - 1].postId; 
                }
                return posts;

                // 에러 발생
            } catch (error) {
                console.error('게시글 로딩 중 오류 발생:', error);
                loader.style.display = 'none';
                const errorMessage = document.createElement('div');
                errorMessage.className = 'error-message';
                errorMessage.style.textAlign = 'center';
                errorMessage.style.padding = '40px 20px';
                errorMessage.style.color = '#e03131';
                errorMessage.style.fontSize = '16px';
                errorMessage.textContent = '게시글을 불러올 수 없습니다.';
                postListContainer.appendChild(errorMessage);
                hasMorePosts = false;
                return [];

            } finally {
                isLoading = false;
            }
        }
    
        // 게시글 요소를 HTML로 만들어 반환
        function createPostElement(post) {

            // 특정 게시물 클릭 시 상세 페이지로 이동
            const postLink = document.createElement('a');
            postLink.href = `/posts/${post.postId}`;
            postLink.className = 'post-item';
            
            // 로그인하지 않은 사용자가 게시물을 클릭하면 토스트 표시
            postLink.addEventListener('click', function(e) {
                const accessToken = localStorage.getItem('accessToken');
                if (!accessToken) {
                    e.preventDefault();
                    showToastAfterRedirect('로그인이 필요한 서비스입니다.');
                    window.location.href = '/login';
                }
            });

            // 제목 26자 제한
            const truncatedTitle = post.title.length > 26 ? post.title.substring(0, 26) + '...' : post.title;
        
            // is_modified가 1일 때만 (수정됨) 태그를 생성
            const modifiedTag = post.is_modified ? '<span class="modified-tag">(수정됨)</span>' : '';
            
            // HTML 변환 
            postLink.innerHTML = `
                <div class="post-header">
                    <h3 class="post-title">${truncatedTitle}</h3>
                    ${modifiedTag}
                </div>
                <div class="post-meta">
                    <div class="post-meta-stats">
                        <span>좋아요 ${formatNumber(post.likeCount)}</span>
                        <span>댓글 ${formatNumber(post.commentCount)}</span>
                        <span>조회수 ${formatNumber(post.viewCount)}</span>
                    </div>
                    <span class="post-date">${new Date(post.createdAt).toLocaleString()}</span>
                </div>
                <div class="post-footer">
                    <div class="post-author">
                        <div class="author-avatar"></div>
                        <span class="author-name">${post.nickname}</span>
                    </div>
                </div>`;
            
            // 작성자 프로필 이미지 표시
            const authorAvatar = postLink.querySelector('.author-avatar');
            if (authorAvatar && post.profileUrl && post.profileUrl.trim() !== '') {
                const testImg = new Image();
                testImg.onload = function() {
                    authorAvatar.style.backgroundImage = `url(${post.profileUrl})`;
                    authorAvatar.style.backgroundSize = 'cover';
                    authorAvatar.style.backgroundPosition = 'center';
                    authorAvatar.style.backgroundColor = 'transparent';
                };
                testImg.onerror = function() {
                    authorAvatar.style.backgroundImage = 'none';
                    authorAvatar.style.backgroundColor = '#e9ecef';
                };
                testImg.src = post.profileUrl;
            } else if (authorAvatar) {
                authorAvatar.style.backgroundImage = 'none';
                authorAvatar.style.backgroundColor = '#e9ecef';
            }
            
            return postLink;
        }

        // 추가 게시물 로드
        async function loadMorePosts() {
            const posts = await fetchPosts(currentCursorId); 
            posts.forEach(post => {
                const postElement = createPostElement(post);
                postListContainer.appendChild(postElement);
            });
        }

        // 인피니티 스크롤
        const observer = new IntersectionObserver((entries) => {
            // entries[0].isIntersecting이 true이면 loader가 화면에 보인다는 의미
            // 첫 페이지 로드가 완료되고, 더 불러올 게 있을 때만 실행
            if (entries[0].isIntersecting && !isLoading && hasMorePosts && !isFirstLoad) {
                loader.style.display = 'block'; // 추가 로드 시 로더 표시
                loadMorePosts();
            }
        }, {
            threshold: 1.0 // loader가 100% 보일 때 실행
        });

        observer.observe(loader);
        // 첫 페이지 로드
        loadMorePosts();

        // 게시물 작성 버튼 클릭 이벤트
        if (createPostButton) {
            createPostButton.addEventListener('click', function(e) {
                const accessToken = localStorage.getItem('accessToken');
                
                // 로그인하지 않은 경우
                if (!accessToken) {
                    e.preventDefault(); // 기본 링크 동작 방지
                    
                    // 페이지 이동 후에도 토스트를 표시하기 위해 localStorage에 저장
                    showToastAfterRedirect('로그인이 필요한 서비스입니다.');
                    
                    // 로그인 페이지로 즉시 이동
                    window.location.href = '/login';
                }
                // 로그인한 경우는 기본 링크 동작 허용
            });
        }
    }
});