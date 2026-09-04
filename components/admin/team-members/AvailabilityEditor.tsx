"use client";

import {useEffect, useMemo, useState} from "react";
import {LoaderCircle, Plus, Trash2} from "lucide-react";
import {Button} from "@/components/ui/button";
import {Checkbox} from "@/components/ui/checkbox";
import {Input} from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {getMemberAvailabilityClient} from "@/lib/admin/admin-availability-client";
import {WEEKDAY_LABELS, weekdayShort} from "@/lib/admin/weekdays";
import {fieldLabelClassName} from "@/components/ui/control-class";
import {
  type ApiAvailability,
  toHourMinute,
} from "@/lib/team-members/admin-availability-types";
import {
  addRecurringUnavailabilityAction,
  addUnavailableDateAction,
  removeRecurringUnavailabilityAction,
  removeUnavailableDateAction,
} from "@/app/admin/team-members/actions";


const emptyAvailability: ApiAvailability = {unavailableDates: [], recurringUnavailability: []};

export function AvailabilityEditor({memberId}: {memberId: string}) {
  const [availability, setAvailability] = useState<ApiAvailability>(emptyAvailability);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMutating, setIsMutating] = useState(false);

  // Add-date form.
  const [dateStart, setDateStart] = useState("");
  const [dateEnd, setDateEnd] = useState("");
  const [dateReason, setDateReason] = useState("");

  // Add-recurring form.
  const [ruleDay, setRuleDay] = useState("1");
  const [ruleWholeDay, setRuleWholeDay] = useState(true);
  const [ruleStart, setRuleStart] = useState("09:00");
  const [ruleEnd, setRuleEnd] = useState("17:00");

  useEffect(() => {
    void (async () => {
      setIsLoading(true);
      setError(null);
      try {
        setAvailability(await getMemberAvailabilityClient(memberId));
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Unable to load availability.");
      } finally {
        setIsLoading(false);
      }
    })();
  }, [memberId]);

  const sortedDates = useMemo(
    () => [...availability.unavailableDates].sort((a, b) => a.startDate.localeCompare(b.startDate)),
    [availability.unavailableDates],
  );
  const sortedRules = useMemo(
    () => [...availability.recurringUnavailability].sort((a, b) => a.dayOfWeek - b.dayOfWeek),
    [availability.recurringUnavailability],
  );

  const handleAddDate = async () => {
    if (!dateStart || !dateEnd) {
      setError("Provide both a start and end date.");
      return;
    }
    setIsMutating(true);
    setError(null);
    const result = await addUnavailableDateAction({
      id: memberId,
      body: {startDate: dateStart, endDate: dateEnd, reason: dateReason.trim() || undefined},
    });
    setIsMutating(false);
    if (result.ok) {
      setAvailability(result.availability);
      setDateStart("");
      setDateEnd("");
      setDateReason("");
    } else {
      setError(result.message);
    }
  };

  const handleRemoveDate = async (dateId: string) => {
    setIsMutating(true);
    const result = await removeUnavailableDateAction({id: memberId, dateId});
    setIsMutating(false);
    if (result.ok) {
      setAvailability((current) => ({
        ...current,
        unavailableDates: current.unavailableDates.filter((entry) => entry.id !== dateId),
      }));
    } else {
      setError(result.message);
    }
  };

  const handleAddRule = async () => {
    if (!ruleWholeDay && ruleEnd <= ruleStart) {
      setError("End time must be after start time.");
      return;
    }
    setIsMutating(true);
    setError(null);
    const result = await addRecurringUnavailabilityAction({
      id: memberId,
      body: {
        dayOfWeek: Number(ruleDay),
        ...(ruleWholeDay ? {} : {startTime: ruleStart, endTime: ruleEnd}),
      },
    });
    setIsMutating(false);
    if (result.ok) {
      setAvailability(result.availability);
    } else {
      setError(result.message);
    }
  };

  const handleRemoveRule = async (ruleId: string) => {
    setIsMutating(true);
    const result = await removeRecurringUnavailabilityAction({id: memberId, ruleId});
    setIsMutating(false);
    if (result.ok) {
      setAvailability((current) => ({
        ...current,
        recurringUnavailability: current.recurringUnavailability.filter((entry) => entry.id !== ruleId),
      }));
    } else {
      setError(result.message);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
        <LoaderCircle className="size-4 animate-spin" />
        Loading availability…
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <p className="text-sm text-muted-foreground">
        Availability is modelled by the negative: list when this member is
        <strong> unavailable</strong>. Times are in UTC. Assigning an unavailable guide to an
        occurrence is rejected.
      </p>

      {error ? (
        <p className="rounded-[var(--wt-radius-sm)] border border-[var(--wt-danger)] bg-[var(--wt-surface)] px-4 py-3 text-sm text-[var(--wt-danger)]">
          {error}
        </p>
      ) : null}

      {/* Unavailable date ranges */}
      <section className="space-y-4">
        <h3 className="text-base font-semibold text-foreground">Unavailable date ranges</h3>

        {sortedDates.length === 0 ? (
          <p className="text-sm text-muted-foreground">No date ranges blocked.</p>
        ) : (
          <div className="space-y-2">
            {sortedDates.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between gap-3 rounded-[var(--wt-radius-sm)] border border-[var(--wt-rule-strong)] bg-white px-4 py-2 text-sm"
              >
                <span>
                  {entry.startDate}
                  {entry.endDate !== entry.startDate ? ` → ${entry.endDate}` : ""}
                  {entry.reason ? <span className="text-muted-foreground"> · {entry.reason}</span> : null}
                </span>
                <Button variant="ghost" size="sm" disabled={isMutating} onClick={() => void handleRemoveDate(entry.id)}>
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        <div className="grid gap-3 rounded-[var(--wt-radius-sm)] border border-dashed border-[var(--wt-rule-strong)] p-4 sm:grid-cols-[1fr_1fr_1fr_auto]">
          <div className="space-y-1">
            <label className={fieldLabelClassName} htmlFor="date-start">From</label>
            <Input id="date-start" type="date" value={dateStart} onChange={(e) => setDateStart(e.target.value)} />
          </div>
          <div className="space-y-1">
            <label className={fieldLabelClassName} htmlFor="date-end">To</label>
            <Input id="date-end" type="date" value={dateEnd} onChange={(e) => setDateEnd(e.target.value)} />
          </div>
          <div className="space-y-1">
            <label className={fieldLabelClassName} htmlFor="date-reason">Reason (optional)</label>
            <Input id="date-reason" value={dateReason} onChange={(e) => setDateReason(e.target.value)} placeholder="Vacation" />
          </div>
          <div className="flex items-end">
            <Button className="h-10" onClick={() => void handleAddDate()} disabled={isMutating}>
              <Plus className="size-4" />
              Add
            </Button>
          </div>
        </div>
      </section>

      {/* Recurring weekly rules */}
      <section className="space-y-4">
        <h3 className="text-base font-semibold text-foreground">Recurring weekly unavailability</h3>

        {sortedRules.length === 0 ? (
          <p className="text-sm text-muted-foreground">No recurring rules.</p>
        ) : (
          <div className="space-y-2">
            {sortedRules.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between gap-3 rounded-[var(--wt-radius-sm)] border border-[var(--wt-rule-strong)] bg-white px-4 py-2 text-sm"
              >
                <span>
                  {weekdayShort(entry.dayOfWeek)}
                  {entry.startTime && entry.endTime
                    ? ` · ${toHourMinute(entry.startTime)}–${toHourMinute(entry.endTime)}`
                    : " · All day"}
                </span>
                <Button variant="ghost" size="sm" disabled={isMutating} onClick={() => void handleRemoveRule(entry.id)}>
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        <div className="space-y-3 rounded-[var(--wt-radius-sm)] border border-dashed border-[var(--wt-rule-strong)] p-4">
          <div className="grid gap-3 sm:grid-cols-[1fr_auto_1fr_1fr]">
            <div className="space-y-1">
              <label className={fieldLabelClassName}>Weekday</label>
              <Select value={ruleDay} onValueChange={setRuleDay}>
                <SelectTrigger className="h-10!">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {WEEKDAY_LABELS.map((day) => (
                    <SelectItem key={day.value} value={String(day.value)}>
                      {day.long}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end pb-2">
              <label className="flex items-center gap-2 text-sm text-foreground">
                <Checkbox checked={ruleWholeDay} onCheckedChange={(value) => setRuleWholeDay(value === true)} />
                All day
              </label>
            </div>
            <div className="space-y-1">
              <label className={fieldLabelClassName} htmlFor="rule-start">From</label>
              <Input id="rule-start" type="time" value={ruleStart} disabled={ruleWholeDay} onChange={(e) => setRuleStart(e.target.value)} />
            </div>
            <div className="space-y-1">
              <label className={fieldLabelClassName} htmlFor="rule-end">To</label>
              <Input id="rule-end" type="time" value={ruleEnd} disabled={ruleWholeDay} onChange={(e) => setRuleEnd(e.target.value)} />
            </div>
          </div>
          <Button className="h-10" onClick={() => void handleAddRule()} disabled={isMutating}>
            <Plus className="size-4" />
            Add rule
          </Button>
        </div>
      </section>
    </div>
  );
}
