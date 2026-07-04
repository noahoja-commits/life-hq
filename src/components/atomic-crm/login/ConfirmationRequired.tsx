import { Notification } from "@/components/admin/notification";
import { useTranslate } from "ra-core";
import { useConfigurationContext } from "../root/ConfigurationContext";

export const ConfirmationRequired = () => {
  const translate = useTranslate();
  const { darkModeLogo: logo, title } = useConfigurationContext();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <div className="flex items-center gap-2">
        <img
          src={logo}
          alt={title}
          width={20}
          className="filter brightness-0 invert"
        />
        <span className="text-xl font-semibold tracking-tight">{title}</span>
      </div>
      <div className="w-full max-w-sm rounded-lg border bg-card p-6 text-center">
        <h1 className="mb-3 text-xl font-semibold tracking-tight">
          {translate("crm.auth.welcome_title", {
            _: "Welcome to Atomic CRM",
          })}
        </h1>
        <p className="text-[13px] text-muted-foreground">
          {translate("crm.auth.confirmation_required", {
            _: "Please follow the link we just sent you by email to confirm your account.",
          })}
        </p>
      </div>
      <Notification />
    </div>
  );
};

ConfirmationRequired.path = "/sign-up/confirm";
