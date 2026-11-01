import { DAYS_OF_WEEK } from '@/lib/dates';
import { toast } from 'sonner';

export default function DayPicker({
  selectedDays = [],
  onChange,
  disabled = false,
  size = 'md',
}) {
  const isCompact = size === 'sm';

  const handleToggle = (dayId) => {
    if (disabled) return;
    const isSelected = selectedDays.includes(dayId);

    if (isSelected) {
      if (selectedDays.length === 1) {
        toast.error('At least one day must be selected');
        return;
      }
      onChange(selectedDays.filter((d) => d !== dayId));
    } else {
      // Keep natural order of days
      const newDays = DAYS_OF_WEEK.filter(
        (d) => d.id === dayId || selectedDays.includes(d.id)
      ).map((d) => d.id);
      onChange(newDays);
    }
  };

  return (
    <div
      className="day-picker-group"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: isCompact ? '3px' : '5px',
      }}
      role="group"
      aria-label="Select days of week"
    >
      {DAYS_OF_WEEK.map((day) => {
        const isSelected = selectedDays.includes(day.id);

        return (
          <button
            key={day.id}
            type="button"
            disabled={disabled}
            onClick={() => handleToggle(day.id)}
            title={day.full}
            aria-pressed={isSelected}
            aria-label={day.full}
            style={{
              width: isCompact ? '24px' : '28px',
              height: isCompact ? '24px' : '28px',
              padding: 0,
              display: 'grid',
              placeItems: 'center',
              borderRadius: '4px',
              border: isSelected
                ? '2px solid var(--ink)'
                : '1.5px solid var(--border-color, rgba(128, 128, 128, 0.35))',
              background: isSelected ? 'var(--ink)' : 'var(--paper-card)',
              color: isSelected ? 'var(--paper)' : 'var(--ink-subtle)',
              boxShadow: isSelected ? '1.5px 1.5px 0 var(--ink)' : 'none',
              font: `800 ${isCompact ? '10px' : '11.5px'} "DM Mono", monospace`,
              cursor: disabled ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s ease',
              outline: 'none',
              userSelect: 'none',
            }}
          >
            {day.label}
          </button>
        );
      })}
    </div>
  );
}

