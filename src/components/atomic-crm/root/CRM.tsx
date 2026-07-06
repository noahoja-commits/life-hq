import type {
  CoreAdminProps,
  AuthProvider,
  DashboardComponent,
  LayoutComponent,
} from "ra-core";
import { CustomRoutes, localStorageStore, Resource, useGetIdentity } from "ra-core";
import { lazy, Suspense, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { Route } from "react-router";
import { QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import { Admin } from "@/components/admin/admin";
import { ForgotPasswordPage } from "@/components/supabase/forgot-password-page";
import { SetPasswordPage } from "@/components/supabase/set-password-page";
import { OAuthConsentPage } from "@/components/supabase/oauth-consent-page";

import companies from "../companies";
import contacts from "../contacts";
import { Dashboard } from "../dashboard/Dashboard";
import deals from "../deals";
import { Layout } from "../layout/Layout";
import { MobileLayout } from "../layout/MobileLayout";
import { SignupPage } from "../login/SignupPage";
import { ConfirmationRequired } from "../login/ConfirmationRequired";
import { ThemePicker } from "../pages/ThemePicker";
import { sectionThemesStore } from "../layout/sectionThemesStore";
import { SectionArt } from "../misc/SectionArt";
// Custom pages are code-split: each loads on first visit instead of shipping
// in the (previously ~2MB) main chunk. Route paths are literals below because
// lazy components have no static .path.
const HubPage = lazy(() => import("../hub/HubPage").then((m) => ({ default: m.HubPage })));
const TrackPage = lazy(() => import("../track/TrackPage").then((m) => ({ default: m.TrackPage })));
const FilesPage = lazy(() => import("../files/FilesPage").then((m) => ({ default: m.FilesPage })));
const ListsPage = lazy(() => import("../lists/ListsPage").then((m) => ({ default: m.ListsPage })));
const RoutinesPage = lazy(() => import("../routines/RoutinesPage").then((m) => ({ default: m.RoutinesPage })));
const VenturesPage = lazy(() => import("../ventures/VenturesPage").then((m) => ({ default: m.VenturesPage })));
const ApplicationsPage = lazy(() => import("../applications/ApplicationsPage").then((m) => ({ default: m.ApplicationsPage })));
const TodosPage = lazy(() => import("../todos/TodosPage").then((m) => ({ default: m.TodosPage })));
const FocusPage = lazy(() => import("../focus/FocusPage").then((m) => ({ default: m.FocusPage })));
const ReviewPage = lazy(() => import("../review/ReviewPage").then((m) => ({ default: m.ReviewPage })));
const CaptureRoute = lazy(() => import("../capture/CaptureRoute").then((m) => ({ default: m.CaptureRoute })));
const ImportPage = lazy(() => import("../misc/ImportPage").then((m) => ({ default: m.ImportPage })));
const ChangelogPage = lazy(() => import("../misc/ChangelogPage").then((m) => ({ default: m.ChangelogPage })));
const PagesPage = lazy(() => import("../pages/PagesPage").then((m) => ({ default: m.PagesPage })));
const PageDetail = lazy(() => import("../pages/PageDetail").then((m) => ({ default: m.PageDetail })));
const TemplatesPage = lazy(() => import("../templates/TemplatesPage").then((m) => ({ default: m.TemplatesPage })));
const MoneyPage = lazy(() => import("../money/MoneyPage").then((m) => ({ default: m.MoneyPage })));
const GoalsPage = lazy(() => import("../goals/GoalsPage").then((m) => ({ default: m.GoalsPage })));
const DatesPage = lazy(() => import("../dates/DatesPage").then((m) => ({ default: m.DatesPage })));
const CalendarPage = lazy(() => import("../calendar/CalendarPage").then((m) => ({ default: m.CalendarPage })));
const ScriptsPage = lazy(() => import("../scripts/ScriptsPage").then((m) => ({ default: m.ScriptsPage })));
const ScriptPopOut = lazy(() => import("../scripts/ScriptPopOut").then((m) => ({ default: m.ScriptPopOut })));
const AiPage = lazy(() => import("../ai/AiPage").then((m) => ({ default: m.AiPage })));
const NetworkPage = lazy(() => import("../network/NetworkPage").then((m) => ({ default: m.NetworkPage })));
const ChatbotPage = lazy(() => import("../chatbot/ChatbotPage").then((m) => ({ default: m.ChatbotPage })));
const OpenClawPage = lazy(() => import("../openclaw/OpenClawPage").then((m) => ({ default: m.OpenClawPage })));
const AgentHubPage = lazy(() => import("../agenthub/AgentHubPage").then((m) => ({ default: m.AgentHubPage })));

/**
 * Route-level suspense + per-section theme: every custom section carries an
 * optional accent (floating palette button), synced across devices.
 */
const Page = ({
  pageKey,
  children,
}: {
  pageKey?: string;
  children: React.ReactNode;
}) => {
  const themes = useSyncExternalStore(
    sectionThemesStore.subscribe,
    sectionThemesStore.get,
  );
  const { identity } = useGetIdentity();
  const salesId = identity?.id ? Number(identity.id) : null;
  useEffect(() => {
    if (salesId) void sectionThemesStore.load(salesId);
  }, [salesId]);

  const accent = pageKey ? themes[pageKey] : undefined;
  const setAccent = (a: string | null) => {
    if (!pageKey) return;
    sectionThemesStore.set(pageKey, a, salesId);
  };
  const sectionBg: Record<string, string> = {
    dashboard: "#120606", todos: "#140606", goals: "#120e06", ventures: "#120404",
    money: "#120e06", track: "#060810", calendar: "#14060a", contacts: "#0a0612",
    hub: "#070810", pages: "#120e08", applications: "#061010", routines: "#060a12",
    focus: "#0a0612", review: "#140606", dates: "#14060a", scripts: "#120e06",
    files: "#070810", network: "#060a12", ai: "#120404", lists: "#080808",
    chatbot: "#120404", openclaw: "#120e04", agenthub: "#120e04",
  };

  return (
    <div
      data-section={pageKey}
      className={pageKey ? "relative min-h-full" : undefined}
      style={
        {
          ...(accent && { "--primary": accent, "--ring": accent }),
          ...(pageKey && sectionBg[pageKey] && { backgroundColor: sectionBg[pageKey] }),
        } as React.CSSProperties
      }
    >
      {pageKey && (
        <div className="absolute top-0 right-0 w-full sm:w-96 h-36 sm:h-44 opacity-25 pointer-events-none z-0 overflow-hidden">
          <SectionArt section={pageKey} />
        </div>
      )}
      <Suspense
        fallback={
          <div className="flex justify-center pt-24">
            <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        }
      >
        {children}
      </Suspense>
      {pageKey && (
        <div className="fixed bottom-20 right-4 z-40 md:bottom-6 rounded-full bg-card/90 backdrop-blur border shadow-md">
          <ThemePicker accent={accent} onChange={setAccent} label="Section theme" />
        </div>
      )}
    </div>
  );
};
import {
  getAuthProvider as defaultAuthProviderBuilder,
  getDataProvider as defaultDataProviderBuilder,
} from "../providers/supabase";
import sales from "../sales";
const SettingsPageMobile = lazy(() =>
  import("../settings/SettingsPageMobile").then((m) => ({ default: m.SettingsPageMobile })),
);
const ProfilePage = lazy(() =>
  import("../settings/ProfilePage").then((m) => ({ default: m.ProfilePage })),
);
const SettingsPage = lazy(() =>
  import("../settings/SettingsPage").then((m) => ({ default: m.SettingsPage })),
);
import {
  CONFIGURATION_STORE_KEY,
  type ConfigurationContextValue,
} from "./ConfigurationContext";
import type { CrmDataProvider } from "../providers/types";
import {
  defaultCompanySectors,
  defaultCurrency,
  defaultDarkModeLogo,
  defaultDealCategories,
  defaultDealPipelineStatuses,
  defaultDealStages,
  defaultLightModeLogo,
  defaultNoteStatuses,
  defaultTaskTypes,
  defaultTitle,
} from "./defaultConfiguration";
import { i18nProvider as defaulti18nProvider } from "../providers/commons/i18nProvider";
import { StartPage } from "../login/StartPage.tsx";
import { useIsMobile } from "@/hooks/use-mobile.ts";
import { MobileTasksList } from "../tasks/MobileTasksList.tsx";
import { ContactListMobile } from "../contacts/ContactList.tsx";
import { ContactShow } from "../contacts/ContactShow.tsx";
import { CompanyShow } from "../companies/CompanyShow.tsx";
import { NoteShowPage } from "../notes/NoteShowPage.tsx";

const defaultStore = localStorageStore(undefined, "CRM");

export type CRMProps = {
  dataProvider?: CrmDataProvider;
  authProvider?: AuthProvider;
  i18nProvider?: CoreAdminProps["i18nProvider"];
  disableTelemetry?: boolean;
  store?: CoreAdminProps["store"];
  dashboard?: DashboardComponent;
  layout?: LayoutComponent;
} & Partial<ConfigurationContextValue>;

/**
 * CRM Component
 *
 * This component sets up and renders the main CRM application using `ra-core`. It provides
 * default configurations and themes but allows for customization through props. The component
 * seeds the store with any custom prop values for backwards compatibility.
 *
 * @param {LabeledValue[]} companySectors - The list of company sectors used in the application.
 * @param {string} currency - The ISO 4217 currency code used to format monetary values (e.g. "USD", "EUR", "GBP").
 * @param {RaThemeOptions} darkTheme - The theme to use when the application is in dark mode.
 * @param {LabeledValue[]} dealCategories - The categories of deals used in the application.
 * @param {string[]} dealPipelineStatuses - The statuses of deals in the pipeline used in the application.
 * @param {DealStage[]} dealStages - The stages of deals used in the application.
 * @param {RaThemeOptions} lightTheme - The theme to use when the application is in light mode.
 * @param {string} logo - The logo used in the CRM application.
 * @param {NoteStatus[]} noteStatuses - The statuses of notes used in the application.
 * @param {LabeledValue[]} taskTypes - The types of tasks used in the application.
 * @param {string} title - The title of the CRM application.
 *
 * @returns {JSX.Element} The rendered CRM application.
 *
 * @example
 * // Basic usage of the CRM component
 * import { CRM } from '@/components/atomic-crm/dashboard/CRM';
 *
 * const App = () => (
 *     <CRM
 *         logo="/path/to/logo.png"
 *         title="My Custom CRM"
 *         lightTheme={{
 *             ...defaultTheme,
 *             palette: {
 *                 primary: { main: '#0000ff' },
 *             },
 *         }}
 *     />
 * );
 *
 * export default App;
 */
export const CRM = ({
  companySectors = defaultCompanySectors,
  currency = defaultCurrency,
  dealCategories = defaultDealCategories,
  dealPipelineStatuses = defaultDealPipelineStatuses,
  dealStages = defaultDealStages,
  darkModeLogo = defaultDarkModeLogo,
  lightModeLogo = defaultLightModeLogo,
  noteStatuses = defaultNoteStatuses,
  taskTypes = defaultTaskTypes,
  title = defaultTitle,
  dataProvider = defaultDataProviderBuilder(),
  authProvider = defaultAuthProviderBuilder(),
  i18nProvider = defaulti18nProvider,
  store = defaultStore,
  googleWorkplaceDomain = import.meta.env.VITE_GOOGLE_WORKPLACE_DOMAIN,
  disableEmailPasswordAuthentication = import.meta.env
    .VITE_DISABLE_EMAIL_PASSWORD_AUTHENTICATION === "true",
  disableTelemetry,
  ...rest
}: CRMProps) => {
  useEffect(() => {
    if (
      disableTelemetry ||
      process.env.NODE_ENV !== "production" ||
      typeof window === "undefined" ||
      typeof window.location === "undefined" ||
      typeof Image === "undefined"
    ) {
      return;
    }
    const img = new Image();
    img.src = `https://atomic-crm-telemetry.marmelab.com/atomic-crm-telemetry?domain=${window.location.hostname}`;
  }, [disableTelemetry]);

  // Seed the store with CRM prop values if not already stored
  // (backwards compatibility for prop-based config)
  useEffect(() => {
    if (!store.getItem(CONFIGURATION_STORE_KEY)) {
      store.setItem(CONFIGURATION_STORE_KEY, {
        companySectors,
        currency,
        dealCategories,
        dealPipelineStatuses,
        dealStages,
        noteStatuses,
        taskTypes,
        title,
        darkModeLogo,
        lightModeLogo,
        googleWorkplaceDomain,
        disableEmailPasswordAuthentication,
      } satisfies ConfigurationContextValue);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store]);

  const isMobile = useIsMobile();

  // on login, pre-fetch the configuration to avoid a flickering
  // when accessing the app for the first time
  const wrappedAuthProvider = useMemo<AuthProvider>(
    () => ({
      ...authProvider,
      login: async (params: any) => {
        const result = await authProvider.login(params);
        try {
          const config = await dataProvider.getConfiguration();
          if (Object.keys(config).length > 0) {
            store.setItem(CONFIGURATION_STORE_KEY, config);
          }
        } catch {
          // Non-critical: config will load via useConfigurationLoader
        }
        return result;
      },
      handleCallback: async (params: any) => {
        if (!authProvider.handleCallback) {
          throw new Error(
            "handleCallback is not implemented in the authProvider",
          );
        }
        const result = await authProvider.handleCallback(params);
        try {
          const config = await dataProvider.getConfiguration();
          if (Object.keys(config).length > 0) {
            store.setItem(CONFIGURATION_STORE_KEY, config);
          }
        } catch {
          // Non-critical: config will load via useConfigurationLoader
        }
        return result;
      },
      logout: async (params: any) => {
        try {
          store.removeItem(CONFIGURATION_STORE_KEY);
        } catch {
          // Ignore
        }
        return authProvider.logout(params);
      },
    }),
    [authProvider, dataProvider, store],
  );

  const ResponsiveAdmin = isMobile ? MobileAdmin : DesktopAdmin;

  return (
    <ResponsiveAdmin
      dataProvider={dataProvider}
      authProvider={wrappedAuthProvider}
      i18nProvider={i18nProvider}
      store={store}
      loginPage={StartPage}
      requireAuth
      disableTelemetry
      {...rest}
    />
  );
};

const DesktopAdmin = (
  props: CoreAdminProps & {
    dashboard?: DashboardComponent;
    layout?: LayoutComponent;
  },
) => {
  return (
    <Admin
      layout={props.layout ?? Layout}
      dashboard={props.dashboard ?? Dashboard}
      {...props}
    >
      <CustomRoutes noLayout>
        <Route path={SignupPage.path} element={<SignupPage />} />
        <Route
          path={ConfirmationRequired.path}
          element={<ConfirmationRequired />}
        />
        <Route path={SetPasswordPage.path} element={<SetPasswordPage />} />
        <Route
          path={ForgotPasswordPage.path}
          element={<ForgotPasswordPage />}
        />
        <Route path={OAuthConsentPage.path} element={<OAuthConsentPage />} />
        <Route path="/script-pop/:id" element={<Page><ScriptPopOut /></Page>} />
      </CustomRoutes>

      <CustomRoutes>
        <Route path="/profile" element={<Page><ProfilePage /></Page>} />
        <Route path="/settings" element={<Page><SettingsPage /></Page>} />
        <Route path="/import" element={<Page><ImportPage /></Page>} />
        <Route path="/changelog" element={<Page><ChangelogPage /></Page>} />
        <Route path="/hub" element={<Page pageKey="hub"><HubPage /></Page>} />
        <Route path="/track" element={<Page pageKey="track"><TrackPage /></Page>} />
        <Route path="/files" element={<Page pageKey="files"><FilesPage /></Page>} />
        <Route path="/lists" element={<Page pageKey="lists"><ListsPage /></Page>} />
        <Route path="/routines" element={<Page pageKey="routines"><RoutinesPage /></Page>} />
        <Route path="/ventures" element={<Page pageKey="ventures"><VenturesPage /></Page>} />
        <Route path="/applications" element={<Page pageKey="applications"><ApplicationsPage /></Page>} />
        <Route path="/todos" element={<Page pageKey="todos"><TodosPage /></Page>} />
        <Route path="/focus" element={<Page pageKey="focus"><FocusPage /></Page>} />
        <Route path="/review" element={<Page pageKey="review"><ReviewPage /></Page>} />
        <Route path="/capture" element={<Page><CaptureRoute /></Page>} />
        <Route path="/pages" element={<Page pageKey="pages"><PagesPage /></Page>} />
        <Route path="/pages/:id" element={<Page><PageDetail /></Page>} />
        <Route path="/templates" element={<Page><TemplatesPage /></Page>} />
        <Route path="/money" element={<Page pageKey="money"><MoneyPage /></Page>} />
        <Route path="/goals" element={<Page pageKey="goals"><GoalsPage /></Page>} />
        <Route path="/dates" element={<Page pageKey="dates"><DatesPage /></Page>} />
        <Route path="/calendar" element={<Page pageKey="calendar"><CalendarPage /></Page>} />
        <Route path="/scripts" element={<Page pageKey="scripts"><ScriptsPage /></Page>} />
        <Route path="/ai" element={<Page pageKey="ai"><AiPage /></Page>} />
        <Route path="/network" element={<Page pageKey="network"><NetworkPage /></Page>} />
        <Route path="/chatbot" element={<Page pageKey="chatbot"><ChatbotPage /></Page>} />
        <Route path="/openclaw" element={<Page pageKey="openclaw"><OpenClawPage /></Page>} />
        <Route path="/agenthub" element={<Page pageKey="agenthub"><AgentHubPage /></Page>} />
      </CustomRoutes>
      <Resource name="links" />
      <Resource name="todos" />
      <Resource name="focus_sessions" />
      <Resource name="hub_items" />
      <Resource name="trackers" />
      <Resource name="log_entries" />
      <Resource name="lists" />
      <Resource name="list_items" />
      <Resource name="routines" />
      <Resource name="routine_steps" />
      <Resource name="routine_checks" />
      <Resource name="ventures" />
      <Resource name="applications" />
      <Resource name="pages" />
      <Resource name="transactions" />
      <Resource name="bills" />
      <Resource name="budgets" />
      <Resource name="goals" />
      <Resource name="goal_milestones" />
      <Resource name="life_dates" />
      <Resource name="balance_checks" />
      <Resource name="scripts" />
      <Resource name="call_logs" />
      <Resource name="waiting_items" />
      <Resource name="things" />
      <Resource name="deals" {...deals} />
      <Resource name="contacts" {...contacts} />
      <Resource name="companies" {...companies} />
      <Resource name="contact_notes" />
      <Resource name="deal_notes" />
      <Resource name="tasks" />
      <Resource name="sales" {...sales} />
      <Resource name="tags" />
    </Admin>
  );
};

const MobileAdmin = (
  props: CoreAdminProps & {
    dashboard?: DashboardComponent;
    layout?: LayoutComponent;
  },
) => {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            gcTime: 1000 * 60 * 60 * 24, // 24 hours
            networkMode: "offlineFirst",
          },
          mutations: {
            networkMode: "offlineFirst",
          },
        },
      }),
  );
  const [asyncStoragePersister] = useState(() =>
    createAsyncStoragePersister({
      storage: localStorage,
    }),
  );

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister: asyncStoragePersister }}
    >
      <Admin
        queryClient={queryClient}
        layout={props.layout ?? MobileLayout}
        dashboard={props.dashboard ?? Dashboard}
        {...props}
      >
        <CustomRoutes noLayout>
          <Route path={SignupPage.path} element={<SignupPage />} />
          <Route
            path={ConfirmationRequired.path}
            element={<ConfirmationRequired />}
          />
          <Route path={SetPasswordPage.path} element={<SetPasswordPage />} />
          <Route
            path={ForgotPasswordPage.path}
            element={<ForgotPasswordPage />}
          />
          <Route path={OAuthConsentPage.path} element={<OAuthConsentPage />} />
          <Route path="/script-pop/:id" element={<Page><ScriptPopOut /></Page>} />
        </CustomRoutes>
        <CustomRoutes>
          <Route path="/settings" element={<Page><SettingsPageMobile /></Page>} />
          <Route path="/changelog" element={<Page><ChangelogPage /></Page>} />
          <Route path="/hub" element={<Page pageKey="hub"><HubPage /></Page>} />
          <Route path="/track" element={<Page pageKey="track"><TrackPage /></Page>} />
          <Route path="/files" element={<Page pageKey="files"><FilesPage /></Page>} />
          <Route path="/lists" element={<Page pageKey="lists"><ListsPage /></Page>} />
          <Route path="/routines" element={<Page pageKey="routines"><RoutinesPage /></Page>} />
          <Route path="/ventures" element={<Page pageKey="ventures"><VenturesPage /></Page>} />
          <Route path="/applications" element={<Page pageKey="applications"><ApplicationsPage /></Page>} />
          <Route path="/todos" element={<Page pageKey="todos"><TodosPage /></Page>} />
          <Route path="/focus" element={<Page pageKey="focus"><FocusPage /></Page>} />
          <Route path="/review" element={<Page pageKey="review"><ReviewPage /></Page>} />
          <Route path="/capture" element={<Page><CaptureRoute /></Page>} />
          <Route path="/pages" element={<Page pageKey="pages"><PagesPage /></Page>} />
          <Route path="/pages/:id" element={<Page><PageDetail /></Page>} />
          <Route path="/templates" element={<Page><TemplatesPage /></Page>} />
          <Route path="/money" element={<Page pageKey="money"><MoneyPage /></Page>} />
          <Route path="/goals" element={<Page pageKey="goals"><GoalsPage /></Page>} />
          <Route path="/dates" element={<Page pageKey="dates"><DatesPage /></Page>} />
          <Route path="/calendar" element={<Page pageKey="calendar"><CalendarPage /></Page>} />
          <Route path="/scripts" element={<Page pageKey="scripts"><ScriptsPage /></Page>} />
          <Route path="/ai" element={<Page pageKey="ai"><AiPage /></Page>} />
          <Route path="/network" element={<Page pageKey="network"><NetworkPage /></Page>} />
          <Route path="/chatbot" element={<Page pageKey="chatbot"><ChatbotPage /></Page>} />
        </CustomRoutes>
        <Resource name="links" />
        <Resource name="deals" {...deals} />
        <Resource name="deal_notes" />
        <Resource name="todos" />
        <Resource name="focus_sessions" />
        <Resource name="hub_items" />
        <Resource name="trackers" />
        <Resource name="log_entries" />
        <Resource name="lists" />
        <Resource name="list_items" />
        <Resource name="routines" />
        <Resource name="routine_steps" />
        <Resource name="routine_checks" />
        <Resource name="ventures" />
        <Resource name="applications" />
        <Resource name="pages" />
        <Resource name="transactions" />
        <Resource name="bills" />
        <Resource name="budgets" />
        <Resource name="goals" />
        <Resource name="goal_milestones" />
        <Resource name="life_dates" />
        <Resource name="balance_checks" />
        <Resource name="scripts" />
        <Resource name="call_logs" />
        <Resource name="waiting_items" />
        <Resource name="things" />
        <Resource
          name="contacts"
          list={ContactListMobile}
          show={ContactShow}
          recordRepresentation={contacts.recordRepresentation}
        >
          <Route path=":id/notes/:noteId" element={<NoteShowPage />} />
        </Resource>
        <Resource name="companies" show={CompanyShow} />
        <Resource name="contact_notes" />
        <Resource name="sales" />
        <Resource name="tags" />
        <Resource name="tasks" list={MobileTasksList} />
      </Admin>
    </PersistQueryClientProvider>
  );
};