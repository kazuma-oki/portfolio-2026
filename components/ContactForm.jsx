"use client";

import { useRef, useState } from "react";
import site from "@/data/site.json";
import Button from "./Button";
import styles from "./ContactForm.module.css";

export default function ContactForm() {
  const { contact, googleForm } = site;
  const ready = Boolean(googleForm.actionUrl);
  const [sent, setSent] = useState(false);
  const submitted = useRef(false);

  // Googleフォームは応答をJSから読めないため、iframeの読み込み完了で成功とみなす
  const onFrameLoad = () => {
    if (submitted.current) setSent(true);
  };

  if (sent) {
    return (
      <div className={styles.thanks}>
        <p className={`${styles.thanksTitle} h3`}>{contact.thanksTitle}</p>
        <p className={`${styles.thanksText} body-s subtext`}>{contact.thanksText}</p>
      </div>
    );
  }

  return (
    <div className={styles.wrap}>
      <form
        className={styles.form}
        method="post"
        action={ready ? googleForm.actionUrl : undefined}
        target="hidden_iframe"
        onSubmit={() => {
          submitted.current = true;
        }}
      >
        {contact.fields.map((f) => {
          const name = ready ? googleForm.entries[f.name] || f.name : f.name;
          return (
            <div className={styles.field} key={f.name}>
              <label className={`${styles.label} caption`} htmlFor={`f-${f.name}`}>
                {f.label}
                {f.required && (
                  <span className={styles.required} aria-hidden="true">
                    *
                  </span>
                )}
              </label>
              {f.type === "textarea" ? (
                <textarea
                  id={`f-${f.name}`}
                  name={name}
                  placeholder={f.placeholder}
                  required={f.required}
                  rows={6}
                />
              ) : (
                <input
                  id={`f-${f.name}`}
                  type={f.type}
                  name={name}
                  placeholder={f.placeholder}
                  required={f.required}
                />
              )}
            </div>
          );
        })}

        <div className={styles.action}>
          <Button type="submit" disabled={!ready}>
            {contact.submitLabel}
          </Button>
          {!ready && (
            <p className={`${styles.notice} caption`}>
              ※送信先が未設定です。data/site.json の googleForm を設定すると有効になります。
            </p>
          )}
        </div>
      </form>

      <iframe name="hidden_iframe" title="送信先" onLoad={onFrameLoad} style={{ display: "none" }} />
    </div>
  );
}
