/* Forms keep the existing Supabase schema and public project configuration.
   No external SDK is needed; requests are sent only after a visitor submits. */
(() => {
  const endpoint = "https://vrdnbwdkapxoaglulujw.supabase.co/rest/v1";
  const publishableKey = "sb_publishable_v83UdxeUwHztASgTKdVvxw_uNfiAcIb";
  const value = (form, id) => form.querySelector("#" + id)?.value.trim() || "";
  const forms = {
    contact: {
      table: "contact_submissions",
      message:
        "Thank you. Your consultation request has been sent. Our team will contact you to confirm the next step.",
      data: (form) => ({
        full_name: value(form, "contact-name"),
        email: value(form, "contact-email"),
        subject: value(form, "contact-subject"),
        message: value(form, "contact-message"),
      }),
    },
    question: {
      table: "question_submissions",
      message:
        "Thank you. Your question has been sent. Our team will get back to you soon.",
      data: (form) => ({
        full_name: value(form, "question-name"),
        email: value(form, "question-email"),
        question: [
          value(form, "question-concern"),
          value(form, "question-message"),
        ]
          .filter(Boolean)
          .join("\n\n"),
      }),
    },
    mentor: {
      table: "mentor_applications",
      message:
        "Application received. Thank you for your interest in mentoring with GSJ. Our team will contact you shortly.",
      data: (form) =>
        Object.fromEntries(
          Object.entries({
            first_name: "first-name",
            last_name: "last-name",
            email: "email",
            phone: "phone",
            project_title: "project-title",
            project_overview: "project-overview",
            research_field: "research-field",
            availability: "availability",
            mode_of_engagement: "mode",
            prior_experience: "experience",
            student_responsibilities: "responsibilities",
            ideal_student_profile: "student-profile",
            skills_learning_outcomes: "skills",
            weekly_time_commitment: "time",
            additional_info: "additional",
            how_heard: "how-heard",
          }).map(([key, id]) => [key, value(form, "mentor-" + id)]),
        ),
    },
  };
  document.querySelectorAll("form[data-form]").forEach((form) => {
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (form.dataset.submitting === "true" || !form.reportValidity()) return;
      const definition = forms[form.dataset.form];
      if (!definition) return;
      const submit = form.querySelector('[type="submit"]');
      const feedback = form.querySelector(".form-feedback");
      const original = submit.innerHTML;
      form.dataset.submitting = "true";
      form.setAttribute("aria-busy", "true");
      submit.disabled = true;
      submit.textContent = "Sending…";
      feedback.textContent = "";
      delete feedback.dataset.error;
      const payload = definition.data(form);
      try {
        const response = await fetch(endpoint + "/" + definition.table, {
          method: "POST",
          headers: {
            apikey: publishableKey,
            "Content-Type": "application/json",
            Prefer: "return=minimal",
          },
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(20000),
        });
        if (!response.ok) throw new Error("Submission failed");
        feedback.textContent = definition.message;
        form.reset();
      } catch {
        feedback.dataset.error = "true";
        feedback.textContent =
          "We couldn’t send your message. Your information is still here. Please try again, call 032 732 6655, or email info@gsj.edu.vn.";
        const email = document.createElement("a");
        email.className = "form-email-fallback";
        email.textContent = "Send this enquiry by email";
        const subject =
          form.dataset.form === "mentor"
            ? "GSJ mentor application"
            : "GSJ consultation & enquiry";
        const body = Object.entries(payload)
          .map(([key, entry]) => key.replaceAll("_", " ") + ": " + entry)
          .join("\n\n");
        email.href =
          "mailto:info@gsj.edu.vn?subject=" +
          encodeURIComponent(subject) +
          "&body=" +
          encodeURIComponent(body);
        feedback.append(email);
      } finally {
        form.dataset.submitting = "false";
        form.removeAttribute("aria-busy");
        submit.disabled = false;
        submit.innerHTML = original;
      }
    });
  });
})();
