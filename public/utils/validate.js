// 이메일 유효성 검사
export function validateEmail() {
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
export function validatePassword() {
    const password = passwordInput.value;
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,20}$/;

    if (password === "") {
        passwordHelper.textContent = "";
        return false;
    } else if (!passwordRegex.test(password)) {
        passwordHelper.textContent = "비밀번호는 8자 이상, 20자 이하이며, 대문자, 소문자, 숫자, 특수문자를 각각 최소 1개 포함해야 합니다.";
        return false;
    } else {
        passwordHelper.textContent = "";
        return true;
    }
}

// 비밀번호 확인 유효성 검사
export function validatePasswordCheck() {
    const password = passwordInput.value;
    const passwordCheck = passwordCheckInput.value;
    if (passwordCheck === "") {
        passwordCheckHelper.textContent = "비밀번호 확인란을 한번 더 입력해주세요.";
        return validationStatus.passwordCheck = false;
    }
    if (password !== passwordCheck) {
        passwordCheckHelper.textContent = "비밀번호가 다릅니다.";
        return validationStatus.passwordCheck = false;
    }
    passwordCheckHelper.textContent = "";
    return validationStatus.passwordCheck = true;
}

// 닉네임 유효성 검사
export function validateNickname() {
    const nickname = nicknameInput.value;
    if (nickname === "") {
        nicknameHelper.textContent = "닉네임을 입력해주세요.";
        return validationStatus.nickname = false;
    }
    if (/\s/.test(nickname)) {
        nicknameHelper.textContent = "띄어쓰기를 없애주세요.";
        return validationStatus.nickname = false;
    }
    if (nickname.length > 10) {
        nicknameHelper.textContent = "닉네임은 최대 10자까지 작성 가능합니다.";
        return validationStatus.nickname = false;
    }
    nicknameHelper.textContent = "";
    return validationStatus.nickname = true;
}