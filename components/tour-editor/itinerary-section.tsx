"use client";

import type { ElementType } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { COMMUTE_MODE_OPTIONS, type CommuteMode, type TourFormState } from "@/lib/tours/admin-tour-form";
import { cn } from "@/lib/utils";
import {
  ArrowDown,
  ArrowUp,
  Bike,
  Bus,
  Car,
  Footprints,
  GripVertical,
  MapPin,
  Plus,
  Route,
  Train,
  Trash2,
} from "lucide-react";

type ItinerarySectionProps = {
  formState: TourFormState;
  updateFormState: <K extends keyof TourFormState>(key: K, value: TourFormState[K]) => void;
  onAddStop: () => void;
  onRemoveStop: (clientId: string) => void;
  onMoveStop: (args: { clientId: string; direction: "up" | "down" }) => void;
  onUpdateStop: (args: {
    clientId: string;
    field: keyof TourFormState["stops"][number];
    value: string;
  }) => void;
};

const commuteModeLabels: Record<CommuteMode, string> = {
  walk: "Walk",
  bike: "Bike",
  bus: "Bus",
  train: "Train",
  metro: "Metro",
  tram: "Tram",
  ferry: "Ferry",
  "private-transport": "Private Transport",
  boat: "Boat",
  other: "Other",
};

const commuteModeIcons: Partial<Record<CommuteMode, ElementType>> = {
  walk: Footprints,
  bike: Bike,
  bus: Bus,
  train: Train,
  metro: Train,
  tram: Train,
  ferry: Route,
  "private-transport": Car,
  boat: Route,
  other: Route,
};

export function ItinerarySection({
                                   formState,
                                   updateFormState,
                                   onAddStop,
                                   onRemoveStop,
                                   onMoveStop,
                                   onUpdateStop,
                                 }: ItinerarySectionProps) {
  const commuteModes = [
    {value: "", label: "Select mode", icon: null},
    ...COMMUTE_MODE_OPTIONS.map((value) => ({
      value,
      label: commuteModeLabels[value],
      icon: commuteModeIcons[value] ?? null,
    })),
  ];

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-border bg-card p-6">
        <h2 className="mb-4 text-lg font-semibold text-foreground">Itinerary Type</h2>

        <div className="flex flex-col gap-3 md:flex-row">
          <button
            type="button"
            onClick={ () => updateFormState("itineraryVariant", "stops") }
            className={ cn(
              "flex-1 rounded-lg border-2 px-6 py-4 text-left transition-all",
              formState.itineraryVariant === "stops"
                ? "border-primary bg-primary/5"
                : "border-border hover:border-muted-foreground/30",
            ) }
          >
            <div className="mb-2 flex items-center gap-3">
              <MapPin className="size-5 text-primary"/>
              <span className="font-semibold text-foreground">Stops-Based</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Define individual stops with coordinates, durations, and connections.
            </p>
          </button>

          <button
            type="button"
            onClick={ () => updateFormState("itineraryVariant", "description") }
            className={ cn(
              "flex-1 rounded-lg border-2 px-6 py-4 text-left transition-all",
              formState.itineraryVariant === "description"
                ? "border-primary bg-primary/5"
                : "border-border hover:border-muted-foreground/30",
            ) }
          >
            <div className="mb-2 flex items-center gap-3">
              <span className="text-lg font-bold text-primary">¶</span>
              <span className="font-semibold text-foreground">Description-Based</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Write a free-form itinerary description in each translation.
            </p>
          </button>
        </div>
      </section>

      { formState.itineraryVariant === "stops" ? (
        <section className="rounded-xl border border-border bg-card p-6">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Tour Stops</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Build the shared itinerary route and keep stop IDs stable for localized copy.
              </p>
            </div>

            <Button onClick={ onAddStop } className="gap-2">
              <Plus className="size-4"/>
              Add Stop
            </Button>
          </div>

          { formState.stops.length === 0 ? (
            <div className="rounded-lg border-2 border-dashed border-border py-12 text-center">
              <MapPin className="mx-auto mb-3 size-10 text-muted-foreground"/>
              <p className="mb-4 text-muted-foreground">No stops added yet.</p>
              <Button onClick={ onAddStop } variant="outline" className="gap-2">
                <Plus className="size-4"/>
                Add Your First Stop
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              { formState.stops.map((stop, index) => {
                const isLast = index === formState.stops.length - 1;
                const CommuteIcon =
                  commuteModes.find((mode) => mode.value === stop.nextCommuteMode)?.icon ?? null;

                return (
                  <div key={ stop.clientId } className="group">
                    <div className="overflow-hidden rounded-xl border border-border bg-background">
                      <div className="flex items-center gap-3 border-b border-border bg-muted/30 px-4 py-3">
                        <div className="flex items-center gap-2">
                          <GripVertical className="size-4 text-muted-foreground"/>
                          <div
                            className="flex size-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                            { index + 1 }
                          </div>
                        </div>

                        <Input
                          value={ stop.id }
                          onChange={ (event) =>
                            onUpdateStop({
                              clientId: stop.clientId,
                              field: "id",
                              value: event.target.value,
                            })
                          }
                          placeholder="stop-1"
                          className="h-8 flex-1 border-0 bg-transparent px-0 font-medium focus-visible:ring-0"
                        />

                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={ () => onMoveStop({clientId: stop.clientId, direction: "up"}) }
                            disabled={ index === 0 }
                            className="opacity-0 transition-opacity group-hover:opacity-100"
                          >
                            <ArrowUp className="size-4"/>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={ () => onMoveStop({clientId: stop.clientId, direction: "down"}) }
                            disabled={ isLast }
                            className="opacity-0 transition-opacity group-hover:opacity-100"
                          >
                            <ArrowDown className="size-4"/>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={ () => onRemoveStop(stop.clientId) }
                            className="opacity-0 text-destructive transition-opacity group-hover:opacity-100 hover:text-destructive"
                          >
                            <Trash2 className="size-4"/>
                          </Button>
                        </div>
                      </div>

                      <div className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-medium text-muted-foreground">
                            Duration (min)
                          </label>
                          <Input
                            type="number"
                            value={ stop.durationMinutes }
                            onChange={ (event) =>
                              onUpdateStop({
                                clientId: stop.clientId,
                                field: "durationMinutes",
                                value: event.target.value,
                              })
                            }
                            placeholder="30"
                            min={ 0 }
                            className="h-9"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-medium text-muted-foreground">Latitude</label>
                          <Input
                            type="number"
                            value={ stop.latitude }
                            onChange={ (event) =>
                              onUpdateStop({
                                clientId: stop.clientId,
                                field: "latitude",
                                value: event.target.value,
                              })
                            }
                            placeholder="40.7128"
                            step="any"
                            className="h-9 font-mono text-sm"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-medium text-muted-foreground">Longitude</label>
                          <Input
                            type="number"
                            value={ stop.longitude }
                            onChange={ (event) =>
                              onUpdateStop({
                                clientId: stop.clientId,
                                field: "longitude",
                                value: event.target.value,
                              })
                            }
                            placeholder="-74.0060"
                            step="any"
                            className="h-9 font-mono text-sm"
                          />
                        </div>

                        <div className="lg:col-span-1"/>
                      </div>
                    </div>

                    { !isLast ? (
                      <div className="flex items-center gap-3 py-3 pl-6">
                        <div className="-my-3 h-8 w-0.5 bg-border"/>
                        <div className="flex flex-1 flex-wrap items-center gap-3">
                          <div className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2">
                            { CommuteIcon ? <CommuteIcon className="size-4 text-muted-foreground"/> : null }
                            <select
                              value={ stop.nextCommuteMode }
                              onChange={ (event) =>
                                onUpdateStop({
                                  clientId: stop.clientId,
                                  field: "nextCommuteMode",
                                  value: event.target.value,
                                })
                              }
                              className="bg-transparent text-sm font-medium text-foreground focus:outline-none"
                            >
                              { commuteModes.map((mode) => (
                                <option key={ mode.value } value={ mode.value }>
                                  { mode.label }
                                </option>
                              )) }
                            </select>
                          </div>

                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              value={ stop.nextDurationMinutes }
                              onChange={ (event) =>
                                onUpdateStop({
                                  clientId: stop.clientId,
                                  field: "nextDurationMinutes",
                                  value: event.target.value,
                                })
                              }
                              placeholder="10"
                              min={ 0 }
                              className="h-8 w-20 text-center"
                            />
                            <span className="text-xs text-muted-foreground">min</span>
                          </div>
                        </div>
                      </div>
                    ) : null }
                  </div>
                );
              }) }
            </div>
          ) }
        </section>
      ) : (
        <section className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-start gap-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <span className="text-lg font-bold text-primary">¶</span>
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Description-Based Itinerary</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                In this mode, the itinerary is authored as free-form text inside each translation.
                Use the Translations section to edit localized itinerary descriptions.
              </p>
            </div>
          </div>
        </section>
      ) }
    </div>
  );
}
