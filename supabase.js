// ============================================
// GSJ Website — Supabase Integration
// ============================================

const SUPABASE_URL = 'https://vrdnbwdkapxoaglulujw.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_v83UdxeUwHztASgTKdVvxw_uNfiAcIb';

// Initialize Supabase client
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ============================================
// Utility: Show toast notification
// ============================================
function showToast(message, type = 'success') {
    // Remove existing toast
    const existing = document.querySelector('.gsj-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'gsj-toast';
    toast.innerHTML = `
        <span class="material-symbols-outlined" style="font-size: 1.4rem;">
            ${type === 'success' ? 'check_circle' : 'error'}
        </span>
        <span>${message}</span>
    `;
    
    Object.assign(toast.style, {
        position: 'fixed',
        bottom: '30px',
        right: '30px',
        background: type === 'success' 
            ? 'linear-gradient(135deg, #059669, #10b981)' 
            : 'linear-gradient(135deg, #dc2626, #ef4444)',
        color: 'white',
        padding: '16px 28px',
        borderRadius: '16px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        fontSize: '1rem',
        fontWeight: '600',
        fontFamily: 'inherit',
        boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
        zIndex: '99999',
        animation: 'slideInRight 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        maxWidth: '420px'
    });

    document.body.appendChild(toast);

    // Auto-remove after 5s
    setTimeout(() => {
        toast.style.animation = 'slideOutRight 0.3s ease-in forwards';
        setTimeout(() => toast.remove(), 300);
    }, 5000);
}

// Inject toast animation CSS
const toastStyle = document.createElement('style');
toastStyle.textContent = `
    @keyframes slideInRight {
        from { transform: translateX(120%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOutRight {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(120%); opacity: 0; }
    }
    .btn-loading {
        pointer-events: none;
        opacity: 0.7;
    }
    .btn-loading::after {
        content: '';
        display: inline-block;
        width: 16px;
        height: 16px;
        border: 2px solid rgba(255,255,255,0.3);
        border-top-color: white;
        border-radius: 50%;
        animation: spin 0.6s linear infinite;
        margin-left: 8px;
    }
    @keyframes spin {
        to { transform: rotate(360deg); }
    }
`;
document.head.appendChild(toastStyle);


// ============================================
// 1. Contact Form (contact.html)
// ============================================
async function submitContactForm(event) {
    event.preventDefault();
    
    const form = event.target;
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    
    // Loading state
    submitBtn.classList.add('btn-loading');
    submitBtn.innerHTML = '<span class="material-symbols-outlined" style="font-size: 1.2rem;">hourglass_top</span> Submitting...';

    const data = {
        full_name: form.querySelector('#contact-name').value.trim(),
        email: form.querySelector('#contact-email').value.trim(),
        subject: form.querySelector('#contact-subject').value,
        message: form.querySelector('#contact-message').value.trim()
    };

    try {
        const { error } = await supabaseClient
            .from('contact_submissions')
            .insert([data]);

        if (error) throw error;

        showToast('Thank you! Your message has been sent successfully.', 'success');
        form.reset();
    } catch (err) {
        console.error('Contact form error:', err.message || err.details || err);
        showToast('Something went wrong. Please try again.', 'error');
    } finally {
        submitBtn.classList.remove('btn-loading');
        submitBtn.innerHTML = originalText;
    }
}


// ============================================
// 2. Mentor Application Form (mentors.html)
// ============================================
async function submitMentorApplication(event) {
    event.preventDefault();
    
    const form = event.target;
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    
    submitBtn.classList.add('btn-loading');
    submitBtn.innerHTML = '<span class="material-symbols-outlined" style="font-size: 1.2rem;">hourglass_top</span> Submitting...';

    const data = {
        first_name: form.querySelector('#mentor-first-name').value.trim(),
        last_name: form.querySelector('#mentor-last-name').value.trim(),
        email: form.querySelector('#mentor-email').value.trim(),
        phone: form.querySelector('#mentor-phone').value.trim(),
        project_title: form.querySelector('#mentor-project-title').value.trim(),
        project_overview: form.querySelector('#mentor-project-overview').value.trim(),
        research_field: form.querySelector('#mentor-research-field').value.trim(),
        availability: form.querySelector('#mentor-availability').value,
        mode_of_engagement: form.querySelector('#mentor-mode').value,
        prior_experience: form.querySelector('#mentor-experience').value,
        student_responsibilities: form.querySelector('#mentor-responsibilities').value.trim(),
        ideal_student_profile: form.querySelector('#mentor-student-profile').value.trim(),
        skills_learning_outcomes: form.querySelector('#mentor-skills').value.trim(),
        weekly_time_commitment: form.querySelector('#mentor-time').value,
        additional_info: form.querySelector('#mentor-additional').value.trim(),
        how_heard: form.querySelector('#mentor-how-heard').value.trim()
    };

    try {
        const { error } = await supabaseClient
            .from('mentor_applications')
            .insert([data]);

        if (error) throw error;

        showToast('Application submitted! We will contact you shortly.', 'success');
        form.reset();
    } catch (err) {
        console.error('Mentor form error:', err.message || err.details || err);
        showToast('Something went wrong. Please try again.', 'error');
    } finally {
        submitBtn.classList.remove('btn-loading');
        submitBtn.innerHTML = originalText;
    }
}


// ============================================
// 3. Question Form (questions.html)
// ============================================
async function submitQuestion(event) {
    event.preventDefault();
    
    const form = event.target;
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    
    submitBtn.classList.add('btn-loading');
    submitBtn.innerHTML = '<span class="material-symbols-outlined" style="font-size: 1.2rem;">hourglass_top</span> Submitting...';

    const data = {
        full_name: form.querySelector('#question-name').value.trim(),
        email: form.querySelector('#question-email').value.trim(),
        question: form.querySelector('#question-message').value.trim()
    };

    try {
        const { error } = await supabaseClient
            .from('question_submissions')
            .insert([data]);

        if (error) throw error;

        showToast('Thank you! We will get back to you soon.', 'success');
        form.reset();
    } catch (err) {
        console.error('Question form error:', err.message || err.details || err);
        showToast('Something went wrong. Please try again.', 'error');
    } finally {
        submitBtn.classList.remove('btn-loading');
        submitBtn.innerHTML = originalText;
    }
}
