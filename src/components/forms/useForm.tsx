"use client";

import { startTransition, useActionState, useEffect, useId, useRef, type FormEvent, type ReactNode } from "react";

export type FieldErrors = Record<string, string>;

export interface FormState {
  error: string | null;
  // Per-field messages keyed by input name; those inputs are outlined in
  // red, get the message underneath, and the first one is focused.
  fieldErrors?: FieldErrors;
  success?: boolean;
  sent?: boolean;
}

const MARK = "data-field-invalid";

/**
 * Shared behaviour for every form: what was typed is never cleared by a
 * rejected submit (the form is submitted without React's automatic reset),
 * the fields the server names in `fieldErrors` are highlighted, and a
 * successful submit clears the form (unless `resetOnSuccess` is false,
 * e.g. for forms editing saved data).
 */
export function useForm<S extends FormState>(
  action: (state: S, formData: FormData) => Promise<S>,
  initialState: S,
  options: { resetOnSuccess?: boolean } = {}
) {
  const [state, dispatch, isPending] = useActionState<S, FormData>(
    action as (state: Awaited<S>, formData: FormData) => Promise<S>,
    initialState as Awaited<S>
  );
  const formRef = useRef<HTMLFormElement>(null);
  const formId = useId();
  const submitted = useRef(false);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLElement | null;
    const formData = new FormData(event.currentTarget, submitter);
    submitted.current = true;
    startTransition(() => dispatch(formData));
  }

  // Editing a highlighted field clears its outline.
  function onInput(event: FormEvent<HTMLFormElement>) {
    const target = event.target as HTMLElement;
    if (target.hasAttribute(MARK)) {
      target.removeAttribute("aria-invalid");
      target.removeAttribute(MARK);
    }
  }

  useEffect(() => {
    const form = formRef.current;
    if (!form || !submitted.current) return;
    form.querySelectorAll(`[${MARK}]`).forEach((el) => {
      el.removeAttribute("aria-invalid");
      el.removeAttribute(MARK);
    });
    let first: HTMLElement | null = null;
    for (const name of Object.keys(state.fieldErrors ?? {})) {
      form.querySelectorAll<HTMLElement>(`[name="${CSS.escape(name)}"]`).forEach((el) => {
        el.setAttribute("aria-invalid", "true");
        el.setAttribute(MARK, "");
        el.setAttribute("aria-describedby", errorId(formId, name));
        first ??= el;
      });
    }
    (first as HTMLElement | null)?.focus();
    if ((state.success || state.sent) && options.resetOnSuccess !== false) form.reset();
  }, [state, formId, options.resetOnSuccess]);

  /** The message for one field, to place under it. */
  function errorFor(name: string): ReactNode {
    const message = state.fieldErrors?.[name];
    if (!message) return null;
    return (
      <p id={errorId(formId, name)} className="text-xs font-semibold text-danger">
        {message}
      </p>
    );
  }

  return {
    state,
    isPending,
    errorFor,
    formProps: { ref: formRef, onSubmit, onInput, noValidate: true },
  };
}

function errorId(formId: string, name: string) {
  return `${formId}-${name.replace(/[^a-zA-Z0-9_-]/g, "_")}-error`;
}
