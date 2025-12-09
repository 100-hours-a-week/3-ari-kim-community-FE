import { API_BASE_URL } from '../../utils/config.js';
import { showToast, showToastAfterRedirect } from '../../utils/toast.js';
import { createFootImage } from '../../utils/footPrint.js';

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
        
        // 한국 시간으로 포맷팅
        function formatKoreanDateTime(dateString) {
            // ISO 문자열을 파싱하여 Date 객체 생성
            const date = new Date(dateString);
            
            // 한국 시간대(Asia/Seoul)로 변환하여 포맷팅
            // toLocaleString이 timeZone 옵션을 지원하므로 직접 사용
            return date.toLocaleString('ko-KR', { 
                timeZone: 'Asia/Seoul',
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            });
        }

        // 서버에서 게시글 데이터를 가져옴
        async function fetchPosts(cursorId) {
            isLoading = true;
            
            // 첫 페이지 로드일 때만 로더 표시
            if (isFirstLoad) {
                loader.style.display = 'block';
            }

            try {
                // API URL 구성 (상대 경로 사용)
                let url = `${API_BASE_URL}/posts?size=10`;
                if (cursorId) { // 첫 페이지 로드가 아닐 때만 cursorId 추가
                    url += `&cursorId=${cursorId}`;
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
                    } else if (!hasMorePosts) {
                        // 게시물이 있고 마지막인 경우
                        loader.style.display = 'block';
                        loader.innerHTML = '<p style="text-align: center; color: #868e96; padding: 20px;">마지막 게시물입니다</p>';
                    }
                    // 게시물이 있고 더 있을 경우는 observer 설정 함수에서 처리
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
                } else {
                    // 로그인한 경우, 현재 스크롤 위치를 저장
                    const scrollPosition = window.pageYOffset || document.documentElement.scrollTop;
                    sessionStorage.setItem('postListScrollPosition', scrollPosition.toString());
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
                    <span class="post-date">${formatKoreanDateTime(post.createdAt)}</span>
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
            if (isLoading || !hasMorePosts) return [];
            
            const posts = await fetchPosts(currentCursorId); 
            posts.forEach(post => {
                const postElement = createPostElement(post);
                postListContainer.appendChild(postElement);
            });
            
            // 마지막 게시물인 경우 메시지 표시
            if (!hasMorePosts && loader) {
                loader.style.display = 'block';
                loader.innerHTML = '<p style="text-align: center; color: #868e96; padding: 20px;">마지막 게시물입니다</p>';
            }
            
            return posts; // Promise 반환을 위해 추가
        }

        // 저장된 스크롤 위치 복원
        function restoreScrollPosition() {
            const savedScrollPosition = sessionStorage.getItem('postListScrollPosition');
            if (savedScrollPosition !== null) {
                const scrollY = parseInt(savedScrollPosition, 10);
                // DOM이 완전히 렌더링되고 이미지 로드까지 고려하여 스크롤 복원
                const restore = () => {
                    window.scrollTo({
                        top: scrollY,
                        behavior: 'auto' // 즉시 이동 (smooth가 아닌)
                    });
                    sessionStorage.removeItem('postListScrollPosition'); // 복원 후 제거
                };
                
                // 이미지 로드를 고려하여 약간의 지연 후 복원
                // requestAnimationFrame을 사용하여 브라우저 렌더링 완료 후 실행
                requestAnimationFrame(() => {
                    setTimeout(restore, 200);
                });
            }
        }
        
        // 게시물 observer 설정 함수
        function setupPostObserver() {
            if (!loader) return;
            
            // 기존 observer 제거 (있다면)
            if (window.postObserver) {
                window.postObserver.disconnect();
            }
            
            if (!hasMorePosts) {
                // 첫 로드에서 이미 모든 게시물을 가져온 경우
                // setupPostObserver가 호출되기 전에 fetchPosts에서 이미 처리했지만,
                // 확인을 위해 다시 설정
                if (loader && loader.style.display !== 'none') {
                    loader.innerHTML = '<p style="text-align: center; color: #868e96; padding: 20px;">마지막 게시물입니다</p>';
                }
                return;
            }
            
            // 추가 게시물이 있는 경우 observer 설정
            loader.innerHTML = '<p>loading...</p>'; // 로더 텍스트 초기화
            loader.style.display = 'block'; // observer가 작동하려면 보여야 함
            
            const observer = new IntersectionObserver((entries) => {
                // entries[0].isIntersecting이 true이면 loader가 화면에 보인다는 의미
                // 더 불러올 게 있을 때만 실행
                if (entries[0].isIntersecting && !isLoading && hasMorePosts) {
                    loader.style.display = 'block'; // 추가 로드 시 로더 표시
                    loader.innerHTML = '<p>loading...</p>'; // 로더 텍스트 복원
                    loadMorePosts();
                }
            }, {
                threshold: 0.1 // loader가 10% 보이면 실행 (더 빠른 로딩)
            });

            observer.observe(loader);
            window.postObserver = observer; // 전역으로 저장하여 나중에 disconnect 가능하게
        }
        
        // 첫 페이지 로드
        loadMorePosts().then(() => {
            // 게시물 로드 완료 후 스크롤 위치 복원
            restoreScrollPosition();
            
            // 인피니티 스크롤 observer 설정 (첫 로드 완료 후)
            setupPostObserver();
        });

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

        // 스크롤 시 foot 이미지 생성 기능
        let lastFootScrollY = 0;
        let scrollThreshold = 200; // 200px 스크롤할 때마다 이미지 생성

        // 스크롤 이벤트 리스너
        let scrollTimeout;
        window.addEventListener('scroll', function() {
            const currentScrollY = window.pageYOffset || document.documentElement.scrollTop;
            const scrollDelta = currentScrollY - lastFootScrollY;
            
            // 아래로 스크롤할 때만 작동
            if (scrollDelta > 0 && scrollDelta >= scrollThreshold) {
                createFootImage({
                    containerWidth: 800,
                    containerPadding: 40,
                    headerHeight: 70,
                    imageSize: 60
                });
                lastFootScrollY = currentScrollY;
            } else if (scrollDelta < 0) {
                // 위로 스크롤할 때는 lastFootScrollY만 업데이트
                lastFootScrollY = currentScrollY;
            }
            
            // 스크롤 이벤트 최적화를 위한 디바운싱
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                // 스크롤이 멈췄을 때 추가 처리 (필요시)
            }, 150);
        });
    }
});