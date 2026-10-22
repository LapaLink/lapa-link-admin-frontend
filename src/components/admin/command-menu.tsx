"use client"

import { useEffect, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { LogOutIcon, SearchIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import { Kbd, KbdGroup } from "@/components/ui/kbd"
import { logout } from "@/lib/auth/actions"
import { NAVIGATION } from "@/lib/admin/navigation"

export function CommandMenu() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [, startTransition] = useTransition()

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault()
        setOpen((current) => !current)
      }
    }
    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [])

  function go(href: string) {
    setOpen(false)
    router.push(href)
  }

  return (
    <>
      <Button
        variant="outline"
        className="w-full max-w-72 justify-start text-muted-foreground"
        onClick={() => setOpen(true)}
      >
        <SearchIcon data-icon="inline-start" />
        <span className="flex-1 text-left">Перейти к разделу…</span>
        <KbdGroup>
          <Kbd>Ctrl</Kbd>
          <Kbd>K</Kbd>
        </KbdGroup>
      </Button>
      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title="Быстрая навигация"
        description="Найдите раздел или действие"
      >
        <Command>
          <CommandInput placeholder="Раздел или действие…" />
          <CommandList>
            <CommandEmpty>Ничего не найдено</CommandEmpty>
            {NAVIGATION.map((group, index) => (
              <CommandGroup key={index} heading={group.title ?? "Основное"}>
                {group.items.map((item) => (
                  <CommandItem
                    key={item.href}
                    value={`${item.title} ${item.description}`}
                    onSelect={() => go(item.href)}
                  >
                    <item.icon />
                    <div className="flex flex-col">
                      <span>{item.title}</span>
                      <span className="text-xs text-muted-foreground">{item.description}</span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
            <CommandSeparator />
            <CommandGroup heading="Аккаунт">
              <CommandItem value="Выйти из панели" onSelect={() => startTransition(() => logout())}>
                <LogOutIcon />
                Выйти
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  )
}
