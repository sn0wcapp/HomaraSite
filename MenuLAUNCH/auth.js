/**
 * Homara Authentication System
 * Handles Firebase authentication with popup modals
 */

class HomaraAuth {
    constructor() {
        // DOM elements
        this.authOverlay = document.getElementById('auth-overlay');
        this.signupModal = document.getElementById('signup-modal');
        this.loginModal = document.getElementById('login-modal');
        
        // Forms
        this.signupForm = document.getElementById('signup-form');
        this.loginForm = document.getElementById('login-form');
        
        // Close buttons
        this.signupClose = document.getElementById('signup-close');
        this.loginClose = document.getElementById('login-close');
        
        // Switch links
        this.switchToLogin = document.getElementById('switch-to-login');
        this.switchToSignup = document.getElementById('switch-to-signup');
        
        // Error elements
        this.signupError = document.getElementById('signup-error');
        this.loginError = document.getElementById('login-error');
        
        // Current user state
        this.currentUser = null;
        this.isAuthenticated = false;
        
        // Initialize
        this.init();
    }
    
    /**
     * Initialize authentication system
     */
    init() {
        console.log('Initializing Homara Authentication...');
        
        // Wait for Firebase to be available
        this.waitForFirebase().then(() => {
            this.setupEventListeners();
            this.setupAuthStateListener();
            console.log('Homara Authentication initialized successfully');
        }).catch(error => {
            console.error('Failed to initialize Firebase:', error);
        });
    }
    
    /**
     * Wait for Firebase to be loaded
     */
    async waitForFirebase() {
        return new Promise((resolve, reject) => {
            const checkFirebase = () => {
                if (window.firebaseAuth && window.createUserWithEmailAndPassword) {
                    resolve();
                } else {
                    setTimeout(checkFirebase, 100);
                }
            };
            checkFirebase();
            
            // Timeout after 10 seconds
            setTimeout(() => reject(new Error('Firebase loading timeout')), 10000);
        });
    }
    
    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Form submissions
        this.signupForm.addEventListener('submit', (e) => this.handleSignup(e));
        this.loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        
        // Close buttons
        this.signupClose.addEventListener('click', () => this.closeModals());
        this.loginClose.addEventListener('click', () => this.closeModals());

        // Edit profile modal elements
        this.editProfileModal = document.getElementById('edit-profile-modal');
        this.editProfileClose = document.getElementById('edit-profile-close');
        this.editProfileForm = document.getElementById('edit-profile-form');

        // Profile icon for collapsed state
        this.profileIconCollapsed = document.getElementById('profileIconCollapsed');

        // Edit profile close button
        if (this.editProfileClose) {
            this.editProfileClose.addEventListener('click', () => this.closeEditProfileModal());
        }
        
        // Switch between modals
        this.switchToLogin.addEventListener('click', (e) => {
            e.preventDefault();
            this.showLoginModal();
        });
        
        this.switchToSignup.addEventListener('click', (e) => {
            e.preventDefault();
            this.showSignupModal();
        });
        
        // Close on overlay click
        this.authOverlay.addEventListener('click', (e) => {
            if (e.target === this.authOverlay) {
                this.closeModals();
            }
        });

        // Close on Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                if (this.authOverlay.classList.contains('active')) {
                    this.closeModals();
                } else if (this.editProfileModal && this.editProfileModal.classList.contains('active')) {
                    this.closeEditProfileModal();
                }
            }
        });

        // Edit profile form submission
        if (this.editProfileForm) {
            this.editProfileForm.addEventListener('submit', (e) => this.handleEditProfileSubmit(e));
        }

        // Profile picture upload
        const uploadBtn = document.getElementById('uploadBtn');
        const profilePictureInput = document.getElementById('profilePictureInput');
        if (uploadBtn && profilePictureInput) {
            uploadBtn.addEventListener('click', () => profilePictureInput.click());
            profilePictureInput.addEventListener('change', (e) => this.handleProfilePictureUpload(e));
        }
    }
    
    /**
     * Setup Firebase auth state listener
     */
    setupAuthStateListener() {
        window.onAuthStateChanged(window.firebaseAuth, (user) => {
            if (user) {
                this.currentUser = user;
                this.isAuthenticated = true;
                console.log('User signed in:', user.email);
                this.onAuthSuccess(user);
            } else {
                this.currentUser = null;
                this.isAuthenticated = false;
                console.log('User signed out');
                this.onAuthSignOut();
            }
        });
    }
    
    /**
     * Show signup modal
     */
    showSignupModal() {
        this.clearErrors();
        this.clearForms();
        this.authOverlay.classList.add('active');
        this.signupModal.classList.add('active');
        this.loginModal.classList.remove('active');
        
        // Focus on first input
        setTimeout(() => {
            document.getElementById('signup-email').focus();
        }, 100);
    }
    
    /**
     * Show login modal
     */
    showLoginModal() {
        this.clearErrors();
        this.clearForms();
        this.authOverlay.classList.add('active');
        this.loginModal.classList.add('active');
        this.signupModal.classList.remove('active');
        
        // Focus on first input
        setTimeout(() => {
            document.getElementById('login-email').focus();
        }, 100);
    }
    
    /**
     * Close all modals
     */
    closeModals() {
        this.authOverlay.classList.remove('active');
        this.signupModal.classList.remove('active');
        this.loginModal.classList.remove('active');
        this.clearErrors();
        this.clearForms();
    }
    
    /**
     * Clear error messages
     */
    clearErrors() {
        this.signupError.textContent = '';
        this.loginError.textContent = '';
    }
    
    /**
     * Clear form inputs
     */
    clearForms() {
        this.signupForm.reset();
        this.loginForm.reset();
    }
    
    /**
     * Handle signup form submission
     */
    async handleSignup(e) {
        e.preventDefault();
        
        const email = document.getElementById('signup-email').value.trim();
        const username = document.getElementById('signup-username').value.trim();
        const password = document.getElementById('signup-password').value;
        
        // Basic validation
        if (!email || !username || !password) {
            this.showError('signup', 'Please fill in all fields');
            return;
        }
        
        if (password.length < 6) {
            this.showError('signup', 'Password must be at least 6 characters');
            return;
        }
        
        // Disable submit button
        const submitBtn = this.signupForm.querySelector('.auth-submit-btn');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Creating Account...';
        
        try {
            // Create user with Firebase Auth
            const userCredential = await window.createUserWithEmailAndPassword(
                window.firebaseAuth, 
                email, 
                password
            );
            
            console.log('User created successfully:', userCredential.user);
            
            // Store username for later use (you mentioned MongoDB integration later)
            // For now, we'll just store it in localStorage as a placeholder
            localStorage.setItem('homara_username', username);
            
            // Close modal - auth state listener will handle the rest
            this.closeModals();
            
        } catch (error) {
            console.error('Signup error:', error);
            this.showError('signup', this.getFirebaseErrorMessage(error));
        } finally {
            // Re-enable submit button
            submitBtn.disabled = false;
            submitBtn.textContent = 'Create Account';
        }
    }
    
    /**
     * Handle login form submission
     */
    async handleLogin(e) {
        e.preventDefault();
        
        const email = document.getElementById('login-email').value.trim();
        const password = document.getElementById('login-password').value;
        
        // Basic validation
        if (!email || !password) {
            this.showError('login', 'Please fill in all fields');
            return;
        }
        
        // Disable submit button
        const submitBtn = this.loginForm.querySelector('.auth-submit-btn');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Logging In...';
        
        try {
            // Sign in with Firebase Auth
            const userCredential = await window.signInWithEmailAndPassword(
                window.firebaseAuth, 
                email, 
                password
            );
            
            console.log('User signed in successfully:', userCredential.user);
            
            // Close modal - auth state listener will handle the rest
            this.closeModals();
            
        } catch (error) {
            console.error('Login error:', error);
            this.showError('login', this.getFirebaseErrorMessage(error));
        } finally {
            // Re-enable submit button
            submitBtn.disabled = false;
            submitBtn.textContent = 'Log In';
        }
    }
    
    /**
     * Show error message
     */
    showError(type, message) {
        const errorElement = type === 'signup' ? this.signupError : this.loginError;
        errorElement.textContent = message;
    }
    
    /**
     * Get user-friendly Firebase error message
     */
    getFirebaseErrorMessage(error) {
        switch (error.code) {
            case 'auth/email-already-in-use':
                return 'An account with this email already exists';
            case 'auth/invalid-email':
                return 'Please enter a valid email address';
            case 'auth/weak-password':
                return 'Password should be at least 6 characters';
            case 'auth/user-not-found':
                return 'No account found with this email';
            case 'auth/wrong-password':
                return 'Incorrect password';
            case 'auth/too-many-requests':
                return 'Too many failed attempts. Please try again later';
            default:
                return error.message || 'An error occurred. Please try again';
        }
    }
    
    /**
     * Handle successful authentication
     */
    onAuthSuccess(user) {
        // Update UI to show authenticated state
        this.updateAuthButtons(true, user);
        
        // You can add more logic here for post-authentication actions
        console.log('Authentication successful for:', user.email);
    }
    
    /**
     * Handle sign out
     */
    onAuthSignOut() {
        // Update UI to show unauthenticated state
        this.updateAuthButtons(false);
        
        // Clear stored username
        localStorage.removeItem('homara_username');
        
        console.log('User signed out');
    }
    
    /**
     * Update auth UI based on authentication state
     */
    updateAuthButtons(isAuthenticated, user = null) {
        const authButtons = document.getElementById('authButtons');
        const userProfile = document.getElementById('userProfile');

        if (isAuthenticated && user) {
            // Hide auth buttons and show user profile
            authButtons.style.display = 'none';
            userProfile.style.display = 'block';
            this.profileIconCollapsed.style.display = 'none'; // Hide profile icon when profile card is shown

            // Update user profile information
            this.updateUserProfile(user);
        } else {
            // Show auth buttons and hide user profile
            authButtons.style.display = 'flex';
            userProfile.style.display = 'none';
            this.profileIconCollapsed.style.display = 'none'; // Hide profile icon when not authenticated

            // Reset auth buttons to original state
            const signupBtn = document.getElementById('signupBtn');
            const loginBtn = document.getElementById('loginBtn');
            signupBtn.textContent = 'Sign Up';
            signupBtn.disabled = false;
            signupBtn.onclick = null;
            loginBtn.textContent = 'Log In';
            loginBtn.onclick = null;
        }

        // Update profile icon visibility based on sidebar state
        this.updateProfileIconVisibility();
    }

    /**
     * Update user profile display
     */
    updateUserProfile(user) {
        const userDisplayName = document.getElementById('userDisplayName');
        const userTitle = document.getElementById('userTitle');
        const userAvatarImg = document.getElementById('userAvatarImg');
        const avatarPlaceholder = document.getElementById('avatarPlaceholder');
        const userProfile = document.getElementById('userProfile');

        // Get username from localStorage or derive from email
        const username = localStorage.getItem('homara_username') || user.email.split('@')[0];
        userDisplayName.textContent = username;

        // Set user title (placeholder for now - will come from MongoDB later)
        const userTitles = ['Builder', 'Founder'];
        const randomTitle = userTitles[Math.floor(Math.random() * userTitles.length)];
        userTitle.textContent = randomTitle;

        // Handle profile picture
        if (user.photoURL) {
            userAvatarImg.src = user.photoURL;
            userAvatarImg.style.display = 'block';
            avatarPlaceholder.style.display = 'none';
        } else {
            // Show placeholder with user's initial
            userAvatarImg.style.display = 'none';
            avatarPlaceholder.style.display = 'flex';
            avatarPlaceholder.textContent = username.charAt(0).toUpperCase();
        }

        // Make user profile card clickable
        userProfile.onclick = () => this.showEditProfileModal(user);
        userProfile.style.cursor = 'pointer';

        // Make profile icon clickable too
        if (this.profileIconCollapsed) {
            this.profileIconCollapsed.onclick = () => this.showEditProfileModal(user);
        }
    }

    /**
     * Update profile icon visibility based on sidebar state
     */
    updateProfileIconVisibility() {
        if (!this.profileIconCollapsed) return;

        // Get current user state
        const user = firebase.auth().currentUser;
        if (!user) {
            this.profileIconCollapsed.style.display = 'none';
            return;
        }

        // Check if sidebar is collapsed (not expanded and not hovered)
        const sidebar = document.querySelector('.sidebar');
        const isCollapsed = !sidebar.classList.contains('expanded') && !sidebar.classList.contains('hovered');

        if (isCollapsed) {
            // Show profile icon when sidebar is collapsed and user is authenticated
            this.profileIconCollapsed.style.display = 'flex';
        } else {
            // Hide profile icon when sidebar is expanded/hovered
            this.profileIconCollapsed.style.display = 'none';
        }
    }

    /**
     * Show edit profile modal
     */
    showEditProfileModal(user) {
        console.log('Opening edit profile modal for:', user.email);

        // Populate form with current user data
        const username = localStorage.getItem('homara_username') || user.email.split('@')[0];
        const userTitle = document.getElementById('userTitle').textContent;

        document.getElementById('edit-username').value = username;
        document.getElementById('edit-email').value = user.email;
        document.getElementById('edit-title').value = userTitle;

        // Update profile picture preview
        const profilePictureImg = document.getElementById('profilePictureImg');
        const profilePicturePlaceholder = document.getElementById('profilePicturePlaceholder');

        if (user.photoURL) {
            profilePictureImg.src = user.photoURL;
            profilePictureImg.style.display = 'block';
            profilePicturePlaceholder.style.display = 'none';
        } else {
            profilePictureImg.style.display = 'none';
            profilePicturePlaceholder.style.display = 'flex';
            profilePicturePlaceholder.textContent = username.charAt(0).toUpperCase();
        }

        // Show modal
        this.authOverlay.classList.add('active');
        this.editProfileModal.classList.add('active');

        // Focus on first input
        setTimeout(() => {
            document.getElementById('edit-username').focus();
        }, 100);
    }

    /**
     * Close edit profile modal
     */
    closeEditProfileModal() {
        this.authOverlay.classList.remove('active');
        this.editProfileModal.classList.remove('active');

        // Clear any error messages
        const errorElement = document.getElementById('edit-profile-error');
        if (errorElement) {
            errorElement.textContent = '';
        }
    }

    /**
     * Handle edit profile form submission
     */
    async handleEditProfileSubmit(e) {
        e.preventDefault();

        const username = document.getElementById('edit-username').value.trim();
        const title = document.getElementById('edit-title').value;

        if (!username) {
            this.showEditProfileError('Username is required');
            return;
        }

        // Disable submit button
        const submitBtn = this.editProfileForm.querySelector('.auth-submit-btn');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Saving...';

        try {
            // Update localStorage (MongoDB integration will come later)
            localStorage.setItem('homara_username', username);
            localStorage.setItem('homara_user_title', title);

            // Update UI immediately
            document.getElementById('userDisplayName').textContent = username;
            document.getElementById('userTitle').textContent = title;

            // Update avatar placeholder if needed
            const avatarPlaceholder = document.getElementById('avatarPlaceholder');
            if (avatarPlaceholder.style.display !== 'none') {
                avatarPlaceholder.textContent = username.charAt(0).toUpperCase();
            }

            console.log('Profile updated successfully');
            this.closeEditProfileModal();

        } catch (error) {
            console.error('Profile update error:', error);
            this.showEditProfileError('Failed to update profile. Please try again.');
        } finally {
            // Re-enable submit button
            submitBtn.disabled = false;
            submitBtn.textContent = 'Save Changes';
        }
    }

    /**
     * Handle profile picture upload
     */
    handleProfilePictureUpload(e) {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file size (5MB max)
        if (file.size > 5 * 1024 * 1024) {
            this.showEditProfileError('File size must be less than 5MB');
            return;
        }

        // Validate file type
        if (!file.type.startsWith('image/')) {
            this.showEditProfileError('Please select a valid image file');
            return;
        }

        // Create preview
        const reader = new FileReader();
        reader.onload = (e) => {
            const profilePictureImg = document.getElementById('profilePictureImg');
            const profilePicturePlaceholder = document.getElementById('profilePicturePlaceholder');

            profilePictureImg.src = e.target.result;
            profilePictureImg.style.display = 'block';
            profilePicturePlaceholder.style.display = 'none';

            // TODO: Upload to Firebase Storage and update user profile
            console.log('Profile picture selected:', file.name);
        };
        reader.readAsDataURL(file);
    }

    /**
     * Show edit profile error message
     */
    showEditProfileError(message) {
        const errorElement = document.getElementById('edit-profile-error');
        if (errorElement) {
            errorElement.textContent = message;
        }
    }
    
    /**
     * Sign out user
     */
    async signOut() {
        try {
            await window.signOut(window.firebaseAuth);
            console.log('User signed out successfully');
        } catch (error) {
            console.error('Sign out error:', error);
        }
    }
}

// Initialize authentication when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Wait a bit for the menu system to initialize first
    setTimeout(() => {
        window.homaraAuth = new HomaraAuth();
    }, 100);
});
