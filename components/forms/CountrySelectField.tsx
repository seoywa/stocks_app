import React, { useMemo, useState } from 'react'
import { Controller } from 'react-hook-form'
import { Check, ChevronsUpDown } from 'lucide-react'
import countryList from 'react-select-country-list'
import ReactCountryFlag from 'react-country-flag'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Label } from '@/components/ui/label'

const CountrySelectField = ({
  name,
  label,
  control,
  error,
  required = false,
}: CountrySelectProps) => {
  const [open, setOpen] = useState(false)

  const countries = useMemo(() => countryList().getData(), [])

  return (
    <div className="space-y-2">
      <Label htmlFor={name} className="form-label">
        {label}
      </Label>

      <Controller
        name={name}
        control={control}
        rules={{
          required: required ? `Please select ${label.toLowerCase()}` : false,
        }}
        render={({ field }) => (
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={open}
                className="w-full justify-between"
              >
                <div className="flex items-center">
                  {field.value && (
                    <ReactCountryFlag
                      countryCode={field.value}
                      svg
                      style={{
                        width: '20px',
                        height: '15px',
                        marginRight: '8px',
                      }}
                    />
                  )}
                  {field.value
                    ? countries.find((country) => country.value === field.value)?.label
                    : "Select country..."}
                </div>
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0">
              <Command>
                <CommandInput placeholder="Search country..." />
                <CommandList>
                  <CommandEmpty>No country found.</CommandEmpty>
                  <CommandGroup>
                    {countries.map((country) => (
                      <CommandItem
                        key={country.value}
                        value={country.label}
                        onSelect={() => {
                          field.onChange(country.value)
                          setOpen(false)
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            field.value === country.value ? "opacity-100" : "opacity-0"
                          )}
                        />
                        <ReactCountryFlag
                          countryCode={country.value}
                          svg
                          style={{
                            width: '20px',
                            height: '15px',
                            marginRight: '8px',
                          }}
                        />
                        {country.label}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        )}
      />

      {error && <p className="text-sm text-red-500">{error.message}</p>}
    </div>
  )
}

export default CountrySelectField