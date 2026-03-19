'use client'
import { useState } from 'react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'
import { Button } from '@/components/ui/button'
import { Check, ChevronsUpDown, Building2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useWorkspaces } from '@/hooks/use-workspaces'
import { useWorkspaceContext } from '@/contexts/WorkspaceContext'
import { CreateWorkspaceDialog } from '@/components/workspace/CreateWorkspaceDialog'

export function WorkspaceSwitcher() {
  const [open, setOpen] = useState(false)
  const { workspaces, loading, refetch } = useWorkspaces()
  const { workspace, setWorkspace } = useWorkspaceContext()

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-48 justify-between"
        >
          <div className="flex items-center gap-2 truncate">
            <Building2 size={14} />
            <span className="truncate">{workspace?.name ?? 'Select workspace'}</span>
          </div>
          <ChevronsUpDown size={14} className="shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-0">
        <Command>
          <CommandInput placeholder="Search..." />
          <CommandList>
            <CommandEmpty>
              {loading ? 'Loading...' : 'No workspaces found'}
            </CommandEmpty>
            <CommandGroup>
              {workspaces.map(ws => (
                <CommandItem
                  key={ws.id}
                  onSelect={() => {
                    setWorkspace(ws)
                    setOpen(false)
                  }}
                  className="flex items-center gap-2"
                >
                  <Check
                    size={14}
                    className={cn(workspace?.id === ws.id ? 'opacity-100' : 'opacity-0')}
                  />
                  <span className="truncate">{ws.name}</span>
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup>
              <CommandItem asChild>
                <CreateWorkspaceDialog onCreated={refetch} />
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
