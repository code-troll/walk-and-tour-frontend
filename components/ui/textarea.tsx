import * as React from "react"

import { controlMultilineClassName } from "@/components/ui/control-class"
import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        controlMultilineClassName,
        // This component grows with its content; a native <textarea> styled
        // with the same class keeps sizing itself with `rows`.
        "flex field-sizing-content",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
