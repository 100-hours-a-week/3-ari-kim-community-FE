// 이메일 유효성 검사
export function validateEmail(emailInput, emailHelper) {
    const email = emailInput.value;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (email === "") {
        emailHelper.textContent = "";
        return false;
    } else if (!emailRegex.test(email)) {
        emailHelper.textContent = "올바른 이메일 주소 형식을 입력해주세요. (예: example@example.com)";
        return false;
    } else {
        emailHelper.textContent = "";
        return true;
    }
}

// 비밀번호 유효성 검사 (8-20자 제한, 대/소문자, 숫자, 특수문자 포함)
// passwordInput이 문자열인 경우와 입력 요소인 경우 모두 처리
export function validatePassword(passwordInput, passwordHelper) {
    // passwordInput이 문자열인 경우와 입력 요소인 경우 모두 처리
    const password = typeof passwordInput === 'string' ? passwordInput : passwordInput.value;
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,20}$/;

    // passwordHelper가 없으면 메시지만 반환 (PasswordUpdatePage에서 사용)
    if (!passwordHelper) {
        if (password === "") {
            return "";
        } else if (!passwordRegex.test(password)) {
            return "비밀번호는 8자 이상, 20자 이하이며, 대문자, 소문자, 숫자, 특수문자를 각각 최소 1개 포함해야 합니다.";
        } else {
            return "";
        }
    }

    // passwordHelper가 있는 경우에도 helper text는 설정하지 않고 유효성만 반환
    if (password === "") {
        return false;
    } else if (!passwordRegex.test(password)) {
        return false;
    } else {
        return true;
    }
}

// 비밀번호 확인 유효성 검사
export function validatePasswordCheck(passwordInput, passwordCheckInput, passwordCheckHelper, validationStatus) {
    const password = passwordInput.value;
    const passwordCheck = passwordCheckInput.value;
    if (passwordCheck === "") {
        passwordCheckHelper.textContent = "비밀번호 확인란을 한번 더 입력해주세요.";
        validationStatus.passwordCheck = false;
        return false;
    }
    if (password !== passwordCheck) {
        passwordCheckHelper.textContent = "비밀번호가 다릅니다.";
        validationStatus.passwordCheck = false;
        return false;
    }
    passwordCheckHelper.textContent = "";
    validationStatus.passwordCheck = true;
    return true;
}

// 닉네임 유효성 검사
// nicknameInput이 문자열인 경우와 입력 요소인 경우 모두 처리
export function validateNickname(nicknameInput, nicknameHelper, validationStatus) {
    // nicknameInput이 문자열인 경우와 입력 요소인 경우 모두 처리
    const nickname = typeof nicknameInput === 'string' ? nicknameInput : nicknameInput.value;
    
    // nicknameHelper가 없으면 메시지만 반환 (UserUpdatePage에서 사용)
    if (!nicknameHelper) {
        if (nickname === "") {
            return "닉네임을 입력해주세요.";
        }
        if (/\s/.test(nickname)) {
            return "띄어쓰기를 없애주세요.";
        }
        if (nickname.length > 10) {
            return "닉네임은 최대 10자까지 작성 가능합니다.";
        }
        return "";
    }
    
    // validationStatus가 있는 경우 (회원가입 페이지 등에서 사용)
    if (nickname === "") {
        nicknameHelper.textContent = "닉네임을 입력해주세요.";
        if (validationStatus) validationStatus.nickname = false;
        return false;
    }
    if (/\s/.test(nickname)) {
        nicknameHelper.textContent = "띄어쓰기를 없애주세요.";
        if (validationStatus) validationStatus.nickname = false;
        return false;
    }
    if (nickname.length > 10) {
        nicknameHelper.textContent = "닉네임은 최대 10자까지 작성 가능합니다.";
        if (validationStatus) validationStatus.nickname = false;
        return false;
    }
    nicknameHelper.textContent = "";
    if (validationStatus) validationStatus.nickname = true;
    return true;
}