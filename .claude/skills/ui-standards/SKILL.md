# UI Standards Skill

> **Purpose**: This skill defines UI patterns, accessibility standards, and component conventions for the web application. Reference this when building, reviewing, or modifying UI components.

---

## Quick Rules

### Always Do

- Use semantic color tokens (`text-foreground`, `bg-primary`) — never hardcoded colors
- Include `sr-only` or `aria-label` on icon-only buttons
- Use `Pencil` for edit actions, `Trash2` for delete actions
- Ensure 44×44px minimum touch targets on interactive elements
- Add `aria-describedby` linking inputs to their error messages
- Use `Loader2` with `animate-spin` for loading states
- Respect `prefers-reduced-motion` with `motion-reduce:` classes

### Never Do

- Import `Edit`, `Edit2`, `Edit3`, `Trash`, or `TrashIcon` from lucide-react
- Use color alone to convey meaning (errors, required fields, status)
- Skip heading levels (h1 → h3 without h2)
- Create interactive elements smaller than 24×24px
- Use `tabIndex` values other than `0`, `-1`
- Hardcode colors like `text-gray-500` or `bg-[#4B7F52]`

---

## Responsive Breakpoints

| Breakpoint | Min Width | Usage                    |
| ---------- | --------- | ------------------------ |
| (default)  | 0px       | Mobile-first base styles |
| `sm:`      | 640px     | Large phones             |
| `md:`      | 768px     | Tablets                  |
| `lg:`      | 1024px    | Laptops/desktops         |
| `xl:`      | 1280px    | Large desktops           |
| `2xl:`     | 1536px    | Extra large screens      |

### Layout Patterns

```tsx
// Page container
<div className="container mx-auto px-4 sm:px-6 lg:px-8">
  {children}
</div>

// Responsive grid
<div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
  {items}
</div>

// Sidebar layout
<div className="flex min-h-screen">
  <aside className="hidden lg:block w-64 shrink-0 border-r">{sidebar}</aside>
  <main className="flex-1 min-w-0">{content}</main>
</div>

// Stack on mobile, row on desktop
<div className="flex flex-col gap-4 sm:flex-row">
  {children}
</div>
```

### Component Responsiveness

| Component      | Mobile                         | Desktop         |
| -------------- | ------------------------------ | --------------- |
| Navigation     | Bottom nav or hamburger        | Sidebar         |
| Tables         | Card view or horizontal scroll | Full table      |
| Modals         | Full-screen sheet              | Centered dialog |
| Action buttons | Full-width stacked             | Inline          |
| Form layouts   | Single column                  | Two columns     |

---

## Icons

All icons from `lucide-react`. Standard size: `h-4 w-4`.

### Icon Reference

| Action        | Icon           | Import           |
| ------------- | -------------- | ---------------- |
| Edit          | Pencil         | `Pencil`         |
| Delete        | Trash2         | `Trash2`         |
| Add           | Plus           | `Plus`           |
| View          | Eye            | `Eye`            |
| Close         | X              | `X`              |
| Settings      | Settings       | `Settings`       |
| Search        | Search         | `Search`         |
| Loading       | Loader2        | `Loader2`        |
| Success       | CheckCircle2   | `CheckCircle2`   |
| Warning       | AlertTriangle  | `AlertTriangle`  |
| Error         | AlertCircle    | `AlertCircle`    |
| Menu          | MoreHorizontal | `MoreHorizontal` |
| Download      | Download       | `Download`       |
| Upload        | Upload         | `Upload`         |
| Copy          | Copy           | `Copy`           |
| Refresh       | RefreshCw      | `RefreshCw`      |
| Back          | ArrowLeft      | `ArrowLeft`      |
| Forward       | ArrowRight     | `ArrowRight`     |
| Expand        | ChevronDown    | `ChevronDown`    |
| Collapse      | ChevronUp      | `ChevronUp`      |
| External link | ExternalLink   | `ExternalLink`   |

### Icon Sizes

| Context              | Size        | Example |
| -------------------- | ----------- | ------- |
| Buttons, inline text | `h-4 w-4`   | 16px    |
| Card headers, alerts | `h-5 w-5`   | 20px    |
| Empty states         | `h-8 w-8`   | 32px    |
| Hero/feature         | `h-12 w-12` | 48px    |

### Prohibited Icons

```tsx
// ❌ WRONG - These are prohibited
import { Edit, Edit2, Edit3, Trash, TrashIcon } from "lucide-react";

// ✅ CORRECT - Use these instead
import { Pencil, Trash2 } from "lucide-react";
```

---

## Buttons

### Variants

| Variant       | Usage               | Example              |
| ------------- | ------------------- | -------------------- |
| `default`     | Primary actions     | Save, Submit, Create |
| `secondary`   | Secondary actions   | Save Draft           |
| `outline`     | Tertiary actions    | Cancel               |
| `ghost`       | Subtle/icon buttons | Icon actions         |
| `destructive` | Dangerous actions   | Delete               |
| `link`        | Inline text links   | Learn more           |

### Button Patterns

```tsx
// Primary action
<Button>Save Changes</Button>

// With icon
<Button>
  <Plus className="h-4 w-4" />
  Add Item
</Button>

// Icon-only (MUST have sr-only or aria-label)
<Button variant="ghost" size="icon" title="Edit">
  <Pencil className="h-4 w-4" />
  <span className="sr-only">Edit</span>
</Button>

// Loading state
<Button disabled>
  <Loader2 className="h-4 w-4 animate-spin" />
  Saving...
</Button>

// Destructive
<Button variant="destructive">
  <Trash2 className="h-4 w-4" />
  Delete
</Button>

// Responsive full-width
<Button className="w-full sm:w-auto">Submit</Button>
```

---

## Forms

### Field Structure

```tsx
<div className="space-y-2">
  <Label htmlFor="email">
    Email{" "}
    <span className="text-destructive" aria-hidden="true">
      *
    </span>
    <span className="sr-only">(required)</span>
  </Label>
  <Input
    id="email"
    type="email"
    placeholder="you@example.com"
    aria-describedby="email-help email-error"
    aria-invalid={!!error}
    className={error ? "border-destructive" : ""}
  />
  <p id="email-help" className="text-sm text-muted-foreground">
    We'll never share your email.
  </p>
  {error && (
    <p
      id="email-error"
      className="text-sm text-destructive flex items-center gap-1"
    >
      <AlertCircle className="h-4 w-4 shrink-0" />
      {error}
    </p>
  )}
</div>
```

### Form Layout

```tsx
// Single column (default)
<form className="space-y-6 max-w-md">
  <div className="space-y-2">
    <Label>Field</Label>
    <Input />
  </div>
  <Button type="submit">Submit</Button>
</form>

// Two-column responsive
<div className="grid gap-4 sm:grid-cols-2">
  <div className="space-y-2">
    <Label>First Name</Label>
    <Input />
  </div>
  <div className="space-y-2">
    <Label>Last Name</Label>
    <Input />
  </div>
</div>

// Fieldset for grouped fields
<fieldset className="space-y-4 border rounded-lg p-4">
  <legend className="px-2 font-medium">Contact Information</legend>
  {/* fields */}
</fieldset>
```

### Input States

| State    | Classes                                  |
| -------- | ---------------------------------------- |
| Default  | (none)                                   |
| Focus    | Automatic via shadcn                     |
| Error    | `border-destructive aria-invalid="true"` |
| Disabled | `disabled opacity-50`                    |

---

## Accessibility (WCAG 2.1 AA)

### Color Contrast

| Element                          | Minimum Ratio |
| -------------------------------- | ------------- |
| Normal text (<18px)              | 4.5:1         |
| Large text (≥18px or ≥14px bold) | 3:1           |
| UI components, icons             | 3:1           |
| Focus indicators                 | 3:1           |

### Keyboard Navigation

| Key         | Expected Behavior                   |
| ----------- | ----------------------------------- |
| `Tab`       | Move to next focusable element      |
| `Shift+Tab` | Move to previous focusable element  |
| `Enter`     | Activate buttons, submit forms      |
| `Space`     | Activate buttons, toggle checkboxes |
| `Escape`    | Close modals, dropdowns             |
| Arrow keys  | Navigate within components          |

### Skip Link (Required)

```tsx
// Place as first element in layout
<a
  href="#main-content"
  className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-100 focus:px-4 focus:py-2 focus:bg-background focus:text-foreground focus:ring-2 focus:ring-ring focus:rounded-md"
>
  Skip to main content
</a>

// Main content target
<main id="main-content" tabIndex={-1} className="outline-none">
  {content}
</main>
```

### ARIA Patterns

```tsx
// Live region for status updates
<div aria-live="polite" aria-atomic="true">
  {statusMessage}
</div>

// Navigation landmarks
<nav aria-label="Main navigation">{/* nav items */}</nav>
<nav aria-label="Breadcrumb">{/* breadcrumbs */}</nav>

// Modal/Dialog
<Dialog>
  <DialogContent aria-labelledby="dialog-title" aria-describedby="dialog-desc">
    <DialogTitle id="dialog-title">Title</DialogTitle>
    <DialogDescription id="dialog-desc">Description</DialogDescription>
  </DialogContent>
</Dialog>

// Decorative icons (hidden from screen readers)
<Icon aria-hidden="true" className="h-4 w-4" />
```

### Touch Targets

| Standard                            | Minimum Size |
| ----------------------------------- | ------------ |
| WCAG 2.1 AA                         | 24×24px      |
| WCAG 2.2 AAA / Mobile best practice | 44×44px      |

```tsx
// Ensure adequate touch target
<Button size="icon" className="h-10 w-10">
  <Pencil className="h-4 w-4" />
</Button>
```

### Reduced Motion

```tsx
// Use motion-reduce prefix
<div className="transition-transform motion-reduce:transition-none">
  {content}
</div>;

// Or check programmatically
const prefersReducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)"
).matches;
```

---

## Feedback & States

### Loading States

```tsx
// Button loading
<Button disabled>
  <Loader2 className="h-4 w-4 animate-spin" />
  Saving...
</Button>

// Skeleton loading
<div className="space-y-4">
  <Skeleton className="h-8 w-1/3" />
  <Skeleton className="h-4 w-full" />
  <Skeleton className="h-4 w-2/3" />
</div>

// Full page loading
<div className="flex items-center justify-center min-h-[400px]">
  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
</div>
```

### Empty States

```tsx
<div className="flex flex-col items-center justify-center py-12 px-4 text-center">
  <div className="rounded-full bg-muted p-4 mb-4">
    <FileText className="h-8 w-8 text-muted-foreground" />
  </div>
  <h3 className="text-lg font-medium mb-2">No documents yet</h3>
  <p className="text-muted-foreground mb-6 max-w-sm">
    Get started by creating your first document.
  </p>
  <Button>
    <Plus className="h-4 w-4" />
    Create Document
  </Button>
</div>
```

### Error States

```tsx
// Inline field error
<p className="text-sm text-destructive flex items-center gap-1">
  <AlertCircle className="h-4 w-4 shrink-0" />
  Error message here
</p>

// Error with recovery
<div className="flex flex-col items-center justify-center py-12 text-center">
  <div className="rounded-full bg-destructive/10 p-4 mb-4">
    <AlertCircle className="h-8 w-8 text-destructive" />
  </div>
  <h3 className="text-lg font-medium mb-2">Something went wrong</h3>
  <p className="text-muted-foreground mb-6">Please try again.</p>
  <Button onClick={handleRetry}>
    <RefreshCw className="h-4 w-4" />
    Try Again
  </Button>
</div>
```

### Alerts

| Type    | Classes                              | Icon            |
| ------- | ------------------------------------ | --------------- |
| Info    | `bg-blue-50 text-blue-700`           | `Info`          |
| Success | `bg-green-50 text-green-700`         | `CheckCircle2`  |
| Warning | `bg-yellow-50 text-yellow-700`       | `AlertTriangle` |
| Error   | `bg-destructive/10 text-destructive` | `AlertCircle`   |

```tsx
<Alert variant="destructive">
  <AlertCircle className="h-5 w-5" />
  <AlertTitle>Error</AlertTitle>
  <AlertDescription>Something went wrong.</AlertDescription>
</Alert>
```

### Toasts

```tsx
// Success
toast({ title: "Saved", description: "Your changes have been saved." });

// Error
toast({
  variant: "destructive",
  title: "Error",
  description: "Failed to save.",
});

// With action
toast({
  title: "Deleted",
  action: (
    <ToastAction altText="Undo" onClick={handleUndo}>
      Undo
    </ToastAction>
  ),
});
```

### Confirmation Dialog

```tsx
<AlertDialog>
  <AlertDialogTrigger asChild>
    <Button variant="destructive">Delete</Button>
  </AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Delete this item?</AlertDialogTitle>
      <AlertDialogDescription>
        This action cannot be undone.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction
        onClick={handleDelete}
        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
      >
        Delete
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

---

## Navigation

### Breadcrumbs

```tsx
<nav aria-label="Breadcrumb" className="mb-4">
  <ol className="flex items-center gap-2 text-sm text-muted-foreground">
    <li>
      <a href="/" className="hover:text-foreground">
        Home
      </a>
    </li>
    <li aria-hidden="true">
      <ChevronRight className="h-4 w-4" />
    </li>
    <li>
      <a href="/docs" className="hover:text-foreground">
        Documents
      </a>
    </li>
    <li aria-hidden="true">
      <ChevronRight className="h-4 w-4" />
    </li>
    <li>
      <span aria-current="page" className="text-foreground font-medium">
        Current
      </span>
    </li>
  </ol>
</nav>
```

### Mobile Navigation

```tsx
// Bottom nav (mobile)
<nav aria-label="Main" className="fixed bottom-0 inset-x-0 lg:hidden border-t bg-background z-50">
  <ul className="flex justify-around py-2">
    <li><NavLink href="/" icon={Home} label="Home" /></li>
    <li><NavLink href="/docs" icon={FileText} label="Docs" /></li>
    <li><NavLink href="/settings" icon={Settings} label="Settings" /></li>
  </ul>
</nav>

// Hamburger menu
<Sheet>
  <SheetTrigger asChild>
    <Button variant="ghost" size="icon" className="lg:hidden">
      <Menu className="h-5 w-5" />
      <span className="sr-only">Open menu</span>
    </Button>
  </SheetTrigger>
  <SheetContent side="left">{/* nav links */}</SheetContent>
</Sheet>
```

### Pagination

```tsx
<nav aria-label="Pagination" className="flex items-center justify-between">
  <p className="text-sm text-muted-foreground">Showing 1-10 of 97</p>
  <div className="flex gap-2">
    <Button variant="outline" size="sm" disabled={page === 1}>
      <ArrowLeft className="h-4 w-4" />
      <span className="sr-only sm:not-sr-only sm:ml-2">Previous</span>
    </Button>
    <Button variant="outline" size="sm" disabled={page === totalPages}>
      <span className="sr-only sm:not-sr-only sm:mr-2">Next</span>
      <ArrowRight className="h-4 w-4" />
    </Button>
  </div>
</nav>
```

---

## Data Display

### Responsive Table

```tsx
// Card view on mobile, table on desktop
<div className="sm:hidden space-y-4">
  {items.map((item) => (
    <Card key={item.id}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base">{item.name}</CardTitle>
        <Badge>{item.status}</Badge>
      </CardHeader>
      <CardFooter className="flex gap-2">
        <Button variant="outline" size="sm" className="flex-1">View</Button>
        <Button variant="outline" size="sm" className="flex-1">Edit</Button>
      </CardFooter>
    </Card>
  ))}
</div>

<div className="hidden sm:block border rounded-lg overflow-hidden">
  <Table>
    <TableHeader>
      <TableRow>
        <TableHead>Name</TableHead>
        <TableHead>Status</TableHead>
        <TableHead className="text-right">Actions</TableHead>
      </TableRow>
    </TableHeader>
    <TableBody>
      {items.map((item) => (
        <TableRow key={item.id}>
          <TableCell className="font-medium">{item.name}</TableCell>
          <TableCell><Badge>{item.status}</Badge></TableCell>
          <TableCell className="text-right">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">Actions</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem><Eye className="h-4 w-4" />View</DropdownMenuItem>
                <DropdownMenuItem><Pencil className="h-4 w-4" />Edit</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive">
                  <Trash2 className="h-4 w-4" />Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
</div>
```

### List with Hover Actions

```tsx
<ul className="divide-y rounded-lg border">
  {items.map((item) => (
    <li
      key={item.id}
      className="group flex items-center justify-between p-4 hover:bg-muted/50"
    >
      <div className="flex items-center gap-3">
        <FileText className="h-5 w-5 text-muted-foreground" />
        <span className="font-medium">{item.name}</span>
      </div>
      {/* Always visible on mobile, hover on desktop */}
      <div className="flex gap-1 lg:opacity-0 lg:group-hover:opacity-100 lg:group-focus-within:opacity-100 transition-opacity">
        <Button variant="ghost" size="icon" title="Edit">
          <Pencil className="h-4 w-4" />
          <span className="sr-only">Edit</span>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          title="Delete"
          className="text-destructive"
        >
          <Trash2 className="h-4 w-4" />
          <span className="sr-only">Delete</span>
        </Button>
      </div>
    </li>
  ))}
</ul>
```

---

## Spacing

Base unit: 4px. Use Tailwind spacing scale.

| Class             | Value | Usage                          |
| ----------------- | ----- | ------------------------------ |
| `gap-1`, `p-1`    | 4px   | Tight spacing, icon gaps       |
| `gap-2`, `p-2`    | 8px   | Related elements               |
| `gap-3`, `p-3`    | 12px  | Button/input padding           |
| `gap-4`, `p-4`    | 16px  | Standard spacing, card padding |
| `gap-6`, `p-6`    | 24px  | Section gaps                   |
| `gap-8`, `py-8`   | 32px  | Major sections                 |
| `gap-12`, `py-12` | 48px  | Page sections                  |

```tsx
// Consistent form spacing
<form className="space-y-6">
  <div className="space-y-2">{/* field */}</div>
  <div className="space-y-2">{/* field */}</div>
</form>

// Button groups
<div className="flex gap-2">
  <Button variant="outline">Cancel</Button>
  <Button>Save</Button>
</div>

// Card internal spacing
<Card className="p-4 sm:p-6">
  <CardHeader className="pb-4">{/* header */}</CardHeader>
  <CardContent className="space-y-4">{/* content */}</CardContent>
</Card>
```

---

## Typography

| Class       | Size | Usage                     |
| ----------- | ---- | ------------------------- |
| `text-xs`   | 12px | Captions, metadata        |
| `text-sm`   | 14px | Secondary text, help text |
| `text-base` | 16px | Body text (default)       |
| `text-lg`   | 18px | Lead paragraphs           |
| `text-xl`   | 20px | Card titles               |
| `text-2xl`  | 24px | Section titles            |
| `text-3xl`  | 30px | Page titles               |

```tsx
// Heading hierarchy (never skip levels)
<h1 className="text-3xl font-bold">Page Title</h1>
<h2 className="text-2xl font-semibold">Section</h2>
<h3 className="text-xl font-medium">Subsection</h3>

// Responsive headings
<h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold">Title</h1>

// Readable line length
<p className="max-w-prose">Long form content...</p>
```

---

## Colors

### Use Semantic Tokens Only

```tsx
// ✅ CORRECT
<div className="bg-background text-foreground">
  <p className="text-muted-foreground">Secondary text</p>
  <Button className="bg-primary text-primary-foreground">Action</Button>
  <span className="text-destructive">Error</span>
</div>

// ❌ WRONG - Hardcoded colors
<div className="bg-white text-black">
  <p className="text-gray-500">Secondary text</p>
  <button className="bg-blue-500">Action</button>
</div>
```

### Available Tokens

| Token                                    | Usage                              |
| ---------------------------------------- | ---------------------------------- |
| `background` / `foreground`              | Page background, primary text      |
| `muted` / `muted-foreground`             | Subtle backgrounds, secondary text |
| `card` / `card-foreground`               | Card surfaces                      |
| `primary` / `primary-foreground`         | Primary actions                    |
| `secondary` / `secondary-foreground`     | Secondary actions                  |
| `destructive` / `destructive-foreground` | Errors, delete actions             |
| `border`                                 | Default borders                    |
| `input`                                  | Form input borders                 |
| `ring`                                   | Focus rings                        |

### Exception: Relationship Colors

```tsx
// Allowed for visual distinction
const relationshipColors = {
  spouse: "bg-rose-100 text-rose-700 border-rose-200",
  child: "bg-sky-100 text-sky-700 border-sky-200",
  parent: "bg-amber-100 text-amber-700 border-amber-200",
  sibling: "bg-emerald-100 text-emerald-700 border-emerald-200",
};
```

---

## Animation

### Durations

| Duration | Class          | Usage              |
| -------- | -------------- | ------------------ |
| 75ms     | `duration-75`  | Micro-interactions |
| 150ms    | `duration-150` | Buttons, toggles   |
| 200ms    | `duration-200` | Standard (default) |
| 300ms    | `duration-300` | Modals, drawers    |

### Patterns

```tsx
// Hover transition
<button className="transition-colors hover:bg-muted">Hover</button>

// Loading spinner
<Loader2 className="h-4 w-4 animate-spin" />

// Skeleton pulse
<div className="animate-pulse bg-muted rounded h-4" />

// Respect reduced motion
<div className="transition-transform motion-reduce:transition-none">
  {content}
</div>
```

---

## Checklist

### Before Submitting UI Code

- [ ] All interactive elements keyboard accessible
- [ ] Icon-only buttons have `sr-only` labels
- [ ] Form inputs have associated labels
- [ ] Error states use `aria-invalid` and `aria-describedby`
- [ ] Color contrast meets 4.5:1 (text) / 3:1 (UI)
- [ ] Touch targets are at least 44×44px on mobile
- [ ] No hardcoded colors (use semantic tokens)
- [ ] Using `Pencil` for edit, `Trash2` for delete
- [ ] Loading states use `Loader2` with `animate-spin`
- [ ] Responsive: works on mobile (320px) through desktop
- [ ] Skip link present in layouts
- [ ] Heading hierarchy is logical (no skipped levels)
