export type SendEmailBinding = {
  send(message: {
    to: string | string[];
    from: string;
    subject: string;
    text?: string;
    html?: string;
  }): Promise<{ messageId?: string }>;
};

export type SendEmailInput = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

export async function sendAuthEmail(
  email: SendEmailBinding | undefined,
  from: string,
  input: SendEmailInput
) {
  if (!email) {
    console.info("[auth:email]", {
      from,
      to: input.to,
      subject: input.subject,
      text: input.text,
    });
    return;
  }

  await email.send({
    to: input.to,
    from,
    subject: input.subject,
    text: input.text,
    html: input.html ?? `<p>${input.text}</p>`,
  });
}
