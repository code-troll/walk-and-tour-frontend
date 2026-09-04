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
  /**
   * The granted tours, keyed by id, with the partner price as typed.
   *
   * An empty string is not zero: it means this partner has no price of its own
   * and pays the tour's, which is what the backend stores as null. Keeping the
   * raw string rather than a number is what lets the field be emptied at all.
   */
  const [grants, setGrants] = useState<Map<string, string>>(new Map());
  /** Empty means "the hotel's contact address", which the backend fills in. */
  const [signInEmail, setSignInEmail] = useState("");
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
    setGrants(
      new Map(
        loaded.tours.map((grant) => [grant.tourId, grant.priceAmount ?? ""]),
      ),
    );
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

  const savedGrants = useMemo(
    () =>
      new Map(
        (hotel?.tours ?? []).map((grant) => [grant.tourId, grant.priceAmount ?? ""]),
      ),
    [hotel],
  );

  // A changed price counts as a change, not just a changed set of tours: the
  // save button is the only way to commit either.
  const hasTourChanges = useMemo(() => {
    if (savedGrants.size !== grants.size) {
      return true;
    }

    for (const [tourId, price] of grants) {
      if (!savedGrants.has(tourId) || savedGrants.get(tourId) !== price.trim()) {
        return true;
      }
    }

    return false;
  }, [grants, savedGrants]);

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
      const result = await setHotelToursAction({
        id: hotelId,
        tours: [...grants].map(([tourId, price]) => ({
          tourId,
          // Empty means "the tour's price", which the backend stores as null.
          priceAmount: price.trim() === "" ? null : price.trim(),
        })),
      });

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
              className={controlClassName}
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
                    () => createHotelUserAction(hotelId as string, signInEmail.trim()),
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
          {hotelUser ? null : (
            <div className="mb-5 max-w-md">
              {/*
                Shown before the button rather than after a failure. The address
                is what the invitation goes to, so an administrator should see it
                before sending — and when the hotel's own address is already
                spoken for, this field is the only way the user can be created
                at all.
              */}
              <Label htmlFor="hotel-signin-email">Sign-in email</Label>
              <Input
                id="hotel-signin-email"
                onChange={(event) => setSignInEmail(event.target.value)}
                placeholder={form.email || "reception@hotel.dk"}
                type="email"
                value={signInEmail}
              />
              <p className="mt-1 text-xs text-[var(--wt-ink-muted)]">
                Defaults to the hotel&apos;s contact address. It has to be unique
                across every account, so give a different one if that address is
                already in use.
              </p>
            </div>
          )}

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
                const isGranted = grants.has(tour.id);
                const price = grants.get(tour.id) ?? "";
                const currency = tour.priceCurrency?.trim().toUpperCase() || "DKK";

                return (
                  <li key={tour.id}>
                    <div className="rounded-[var(--wt-radius-sm)] border border-[var(--wt-rule-strong)] p-3">
                      <label className="flex cursor-pointer items-start gap-3">
                        <Checkbox
                          checked={isGranted}
                          className="mt-0.5"
                          onCheckedChange={(checked) =>
                            setGrants((current) => {
                              const next = new Map(current);

                              if (checked === true) {
                                next.set(tour.id, "");
                              } else {
                                next.delete(tour.id);
                              }

                              return next;
                            })
                          }
                        />
                        <span className="min-w-0">
                          <span className="block text-sm font-medium text-[var(--wt-ink)]">{tour.name}</span>
                          <span className="block text-xs text-[var(--wt-ink-muted)]">{tour.tourType}</span>
                        </span>
                      </label>

                      {isGranted ? (
                        <div className="mt-3 flex items-end gap-3 pl-7">
                          <div className="w-36">
                            <Label htmlFor={`price-${tour.id}`}>Price per person</Label>
                            <Input
                              id={`price-${tour.id}`}
                              inputMode="decimal"
                              onChange={(event) =>
                                setGrants((current) =>
                                  new Map(current).set(tour.id, event.target.value),
                                )
                              }
                              // The tour's own price is the placeholder rather than
                              // the value: typing nothing has to keep meaning "the
                              // tour's price", including after it changes.
                              placeholder={tour.priceAmount ?? "No price"}
                              value={price}
                            />
                          </div>
                          <p className="pb-2 text-xs text-[var(--wt-ink-muted)]">
                            {currency}
                            {price.trim() === "" ? " · tour price" : ""}
                          </p>
                        </div>
                      ) : null}
                    </div>
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
