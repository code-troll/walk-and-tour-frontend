"use client";

import {useCallback, useEffect, useMemo, useState} from "react";
import {useRouter} from "next/navigation";
import {LoaderCircle} from "lucide-react";

import {AdminProgressLink, useAdminRouteLoadingBoundary} from "@/components/admin/AdminRouteProgress";
import {AdminBackRow, AdminHeaderMeta, AdminNoticeCard, AdminSectionCard} from "@/components/admin/AdminUi";
import {controlClassName} from "@/components/ui/control-class";
import {Button} from "@/components/ui/button";
import {Checkbox} from "@/components/ui/checkbox";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";
import {getAdminHotelClient, getAdminHotelUserClient} from "@/lib/admin/admin-hotel-client";
import {getAdminToursClient} from "@/lib/admin/admin-client";
import {formatAdminDate} from "@/lib/admin/format-date";
import type {components} from "@/lib/api/generated/backend-types";
import {
  createEmptyHotelFormState,
  createHotelFormStateFromApi,
  HOTEL_STATUSES,
  HOTEL_STATUS_LABELS,
  toCreateHotelBody,
  toUpdateHotelBody,
  validateHotelForm,
  HOTEL_USER_STATUS_DESCRIPTIONS,
  HOTEL_USER_STATUS_LABELS,
  type ApiHotel,
  type ApiHotelUser,
  type HotelFormErrors,
  type HotelFormState,
  type HotelStatus,
} from "@/lib/hotels/admin-hotel-types";
import {
  createHotelAction,
  createHotelUserAction,
  resendHotelUserInvitationAction,
  setHotelToursAction,
  setHotelUserEnabledAction,
  updateHotelAction,
} from "./actions";

type TourSummary = components["schemas"]["TourAdminListResponseDto"];

type HotelEditorClientProps = {
  mode: "create" | "edit";
  hotelId?: string;
};

const FEEDBACK_TIMEOUT_MS = 5000;

export default function HotelEditorClient({mode, hotelId}: HotelEditorClientProps) {
  const router = useRouter();

  const [form, setForm] = useState<HotelFormState>(createEmptyHotelFormState);
  const [errors, setErrors] = useState<HotelFormErrors>({});
  const [hotel, setHotel] = useState<ApiHotel | null>(null);
  const [tours, setTours] = useState<TourSummary[]>([]);
  const [grantedTourIds, setGrantedTourIds] = useState<string[]>([]);
  const [hotelUser, setHotelUser] = useState<ApiHotelUser | null>(null);
  const [pendingUserAction, setPendingUserAction] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(mode === "edit");
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingTours, setIsSavingTours] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useAdminRouteLoadingBoundary(isLoading);

  const announce = useCallback((message: string) => {
    setSuccessMessage(message);
    window.setTimeout(() => setSuccessMessage(null), FEEDBACK_TIMEOUT_MS);
  }, []);

  const applyHotel = useCallback((loaded: ApiHotel) => {
    setHotel(loaded);
    setForm(createHotelFormStateFromApi(loaded));
    setGrantedTourIds(loaded.tours.map((grant) => grant.tourId));
  }, []);

  const loadWorkspace = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);

    try {
      const [loadedTours, loadedHotel, loadedUser] = await Promise.all([
        getAdminToursClient(),
        mode === "edit" && hotelId ? getAdminHotelClient(hotelId) : Promise.resolve(null),
        mode === "edit" && hotelId ? getAdminHotelUserClient(hotelId) : Promise.resolve(null),
      ]);

      setTours(loadedTours);
      setHotelUser(loadedUser);

      if (mode === "edit") {
        if (!loadedHotel) {
          setLoadError("This hotel was not found. It may have been removed.");
          return;
        }

        applyHotel(loadedHotel);
      }
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Unable to load the hotel.");
    } finally {
      setIsLoading(false);
    }
  }, [applyHotel, hotelId, mode]);

  useEffect(() => {
    void loadWorkspace();
  }, [loadWorkspace]);

  const grantedSet = useMemo(() => new Set(grantedTourIds), [grantedTourIds]);

  const savedGrantIds = useMemo(
    () => new Set((hotel?.tours ?? []).map((grant) => grant.tourId)),
    [hotel],
  );

  const hasTourChanges = useMemo(() => {
    if (savedGrantIds.size !== grantedSet.size) {
      return true;
    }

    for (const tourId of grantedSet) {
      if (!savedGrantIds.has(tourId)) {
        return true;
      }
    }

    return false;
  }, [grantedSet, savedGrantIds]);

  const updateField = <K extends keyof HotelFormState>(key: K, value: HotelFormState[K]) => {
    setForm((current) => ({...current, [key]: value}));
    setErrors((current) => ({...current, [key]: undefined}));
  };

  const handleSubmit = async () => {
    const validation = validateHotelForm(form);
    setErrors(validation);

    if (Object.keys(validation).length > 0) {
      setFormError("Check the highlighted fields and try again.");
      return;
    }

    setIsSaving(true);
    setFormError(null);

    try {
      if (mode === "create") {
        const result = await createHotelAction(toCreateHotelBody(form));

        if (!result.ok) {
          setFormError(result.message);
          return;
        }

        router.push(`/hotels/${result.hotel.id}`);
        return;
      }

      if (!hotelId) {
        return;
      }

      const result = await updateHotelAction({id: hotelId, body: toUpdateHotelBody(form)});

      if (!result.ok) {
        setFormError(result.message);
        return;
      }

      applyHotel(result.hotel);
      announce("Hotel details saved.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveTours = async () => {
    if (!hotelId) {
      return;
    }

    setIsSavingTours(true);
    setFormError(null);

    try {
      const result = await setHotelToursAction({id: hotelId, tourIds: grantedTourIds});

      if (!result.ok) {
        setFormError(result.message);
        return;
      }

      applyHotel(result.hotel);
      announce("Tour grants updated.");
    } finally {
      setIsSavingTours(false);
    }
  };

  const runUserAction = async (
    key: string,
    action: () => Promise<
      {ok: true; user: ApiHotelUser} | {ok: false; message: string; statusCode: number}
    >,
    successMessage: string,
  ) => {
    setPendingUserAction(key);
    setFormError(null);

    try {
      const result = await action();

      if (!result.ok) {
        setFormError(result.message);
        return;
      }

      setHotelUser(result.user);
      announce(successMessage);
    } finally {
      setPendingUserAction(null);
    }
  };

  if (isLoading) {
    return (
      <AdminNoticeCard
        eyebrow="Admin API"
        title="Loading…"
        description="Fetching the hotel and the tour catalogue."
      />
    );
  }

  if (loadError) {
    return (
      <AdminNoticeCard
        eyebrow="Admin API"
        title="This hotel could not be loaded."
        description={loadError}
        actions={
          <>
            <Button onClick={() => void loadWorkspace()} variant="outline">
              Retry
            </Button>
            <Button asChild variant="ghost">
              <AdminProgressLink href="/hotels">Back to hotels</AdminProgressLink>
            </Button>
          </>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <AdminBackRow href="/hotels" label="Hotels">
        {hotel ? (
          <AdminHeaderMeta>Last updated {formatAdminDate(hotel.audit.updatedAt)}</AdminHeaderMeta>
        ) : null}
      </AdminBackRow>

      {formError ? (
        <p className="rounded-[var(--wt-radius-sm)] border border-[var(--wt-danger)] bg-[var(--wt-surface)] px-4 py-3 text-sm text-[var(--wt-danger)]">
          {formError}
        </p>
      ) : null}

      {successMessage ? (
        <p className="rounded-[var(--wt-radius-sm)] border border-[var(--wt-status-confirmed)] bg-[var(--wt-status-confirmed-bg)] px-4 py-3 text-sm text-[var(--wt-status-confirmed)]">
          {successMessage}
        </p>
      ) : null}

      <AdminSectionCard
        title={mode === "create" ? "Register a hotel" : hotel?.name ?? "Hotel"}
        description="These details identify the hotel for invoicing and correspondence. The hotel's own access user is registered separately."
        actions={
          <Button disabled={isSaving} onClick={() => void handleSubmit()}>
            {isSaving ? <LoaderCircle className="size-4 animate-spin" /> : null}
            {mode === "create" ? "Register hotel" : "Save details"}
          </Button>
        }
      >
        <div className="grid gap-5 md:grid-cols-2">
          <div className="md:col-span-2">
            <Label htmlFor="hotel-name">Name</Label>
            <Input
              id="hotel-name"
              onChange={(event) => updateField("name", event.target.value)}
              placeholder="Copenhagen Admiral Hotel"
              value={form.name}
            />
            {errors.name ? <FieldError message={errors.name} /> : null}
          </div>

          <div className="md:col-span-2">
            <Label htmlFor="hotel-address">Address</Label>
            <Input
              id="hotel-address"
              onChange={(event) => updateField("address", event.target.value)}
              placeholder="Toldbodgade 24-28, 1253 København K"
              value={form.address}
            />
            {errors.address ? <FieldError message={errors.address} /> : null}
          </div>

          <div>
            <Label htmlFor="hotel-phone">Telephone</Label>
            <Input
              id="hotel-phone"
              onChange={(event) => updateField("phone", event.target.value)}
              placeholder="+45 33 74 14 14"
              value={form.phone}
            />
            {errors.phone ? <FieldError message={errors.phone} /> : null}
          </div>

          <div>
            <Label htmlFor="hotel-email">Contact email</Label>
            <Input
              id="hotel-email"
              onChange={(event) => updateField("email", event.target.value)}
              placeholder="reception@example.com"
              type="email"
              value={form.email}
            />
            {errors.email ? <FieldError message={errors.email} /> : null}
          </div>

          <div>
            <Label htmlFor="hotel-cvr">CVR number</Label>
            <Input
              id="hotel-cvr"
              onChange={(event) => updateField("cvr", event.target.value)}
              placeholder="12345678"
              value={form.cvr}
            />
            <p className="mt-1 text-xs text-[var(--wt-ink-muted)]">
              Eight digits. Spaces and a leading DK are removed automatically.
            </p>
            {errors.cvr ? <FieldError message={errors.cvr} /> : null}
          </div>

          <div>
            <Label htmlFor="hotel-status">Status</Label>
            <select
              className={`mt-1 ${controlClassName}`}
              id="hotel-status"
              onChange={(event) => updateField("status", event.target.value as HotelStatus)}
              value={form.status}
            >
              {HOTEL_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {HOTEL_STATUS_LABELS[status] ?? status}
                </option>
              ))}
            </select>
          </div>
        </div>
      </AdminSectionCard>

      {mode === "edit" ? (
        <AdminSectionCard
          title="Hotel access"
          description="The single user this hotel signs in with. The hotel chooses its own password through an emailed link; nobody here ever sets or sees it."
          actions={
            hotelUser ? (
              <div className="flex flex-wrap gap-2">
                <Button
                  disabled={pendingUserAction !== null || hotelUser.status === "disabled"}
                  onClick={() =>
                    void runUserAction(
                      "resend",
                      () => resendHotelUserInvitationAction(hotelId as string),
                      "Password link sent.",
                    )
                  }
                  variant="outline"
                >
                  {pendingUserAction === "resend" ? (
                    <LoaderCircle className="size-4 animate-spin" />
                  ) : null}
                  Send password link
                </Button>
                <Button
                  disabled={pendingUserAction !== null}
                  onClick={() =>
                    void runUserAction(
                      "toggle",
                      () =>
                        setHotelUserEnabledAction({
                          hotelId: hotelId as string,
                          isEnabled: hotelUser.status === "disabled",
                        }),
                      hotelUser.status === "disabled"
                        ? "Access enabled."
                        : "Access disabled.",
                    )
                  }
                  variant="outline"
                >
                  {pendingUserAction === "toggle" ? (
                    <LoaderCircle className="size-4 animate-spin" />
                  ) : null}
                  {hotelUser.status === "disabled" ? "Enable access" : "Disable access"}
                </Button>
              </div>
            ) : (
              <Button
                disabled={pendingUserAction !== null}
                onClick={() =>
                  void runUserAction(
                    "create",
                    () => createHotelUserAction(hotelId as string),
                    "Access user created and invitation sent.",
                  )
                }
              >
                {pendingUserAction === "create" ? (
                  <LoaderCircle className="size-4 animate-spin" />
                ) : null}
                Create access user
              </Button>
            )
          }
        >
          {hotelUser ? (
            <dl className="grid gap-4 md:grid-cols-3">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--wt-ink-muted)]">
                  Username
                </dt>
                <dd className="mt-1 font-mono text-sm text-[var(--wt-ink)]">{hotelUser.username}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--wt-ink-muted)]">
                  Sign-in email
                </dt>
                <dd className="mt-1 text-sm text-[var(--wt-ink)]">{hotelUser.email}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--wt-ink-muted)]">
                  Status
                </dt>
                <dd className="mt-1 text-sm text-[var(--wt-ink)]">
                  {HOTEL_USER_STATUS_LABELS[hotelUser.status] ?? hotelUser.status}
                  {hotelUser.lastLoginAt ? (
                    <span className="block text-xs text-[var(--wt-ink-muted)]">
                      Last signed in {formatAdminDate(hotelUser.lastLoginAt)}
                    </span>
                  ) : null}
                </dd>
              </div>
              <p className="text-xs text-[var(--wt-ink-muted)] md:col-span-3">
                {HOTEL_USER_STATUS_DESCRIPTIONS[hotelUser.status] ?? ""}
              </p>
            </dl>
          ) : (
            <p className="py-2 text-sm text-[var(--wt-ink-muted)]">
              This hotel cannot sign in yet. Creating the access user derives a username from the
              hotel name and emails {form.email || "the contact address"} a link to set a password.
            </p>
          )}
        </AdminSectionCard>
      ) : null}

      {mode === "edit" ? (
        <AdminSectionCard
          title="Tours this hotel may sell"
          description="Removing a tour revokes the grant. The grant stays on record, and existing bookings for it are unaffected."
          actions={
            <Button
              disabled={!hasTourChanges || isSavingTours}
              onClick={() => void handleSaveTours()}
            >
              {isSavingTours ? <LoaderCircle className="size-4 animate-spin" /> : null}
              Save tours
            </Button>
          }
        >
          {tours.length === 0 ? (
            <p className="py-6 text-sm text-[var(--wt-ink-muted)]">
              There are no tours in the catalogue yet.
            </p>
          ) : (
            <ul className="grid gap-2 md:grid-cols-2">
              {tours.map((tour) => {
                const isGranted = grantedSet.has(tour.id);

                return (
                  <li key={tour.id}>
                    <label className="flex cursor-pointer items-start gap-3 rounded-[var(--wt-radius-sm)] border border-[var(--wt-rule-strong)] px-4 py-3 transition hover:border-[var(--wt-rule-strong)]">
                      <Checkbox
                        checked={isGranted}
                        className="mt-0.5"
                        onCheckedChange={(checked) =>
                          setGrantedTourIds((current) =>
                            checked === true
                              ? [...current, tour.id]
                              : current.filter((id) => id !== tour.id),
                          )
                        }
                      />
                      <span className="min-w-0">
                        <span className="block text-sm font-medium text-[var(--wt-ink)]">{tour.name}</span>
                        <span className="block text-xs text-[var(--wt-ink-muted)]">{tour.tourType}</span>
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
          )}

          {hasTourChanges ? (
            <p className="mt-4 text-xs text-[var(--wt-ink-muted)]">
              You have unsaved changes to the tour grants.
            </p>
          ) : null}
        </AdminSectionCard>
      ) : null}
    </div>
  );
}

const FieldError = ({message}: {message: string}) => (
  <p className="mt-1 text-xs text-[var(--wt-danger)]">{message}</p>
);
