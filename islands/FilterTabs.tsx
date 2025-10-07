import { Signal } from "@preact/signals";

type FilterTabsProps = {
    currentTab: Signal<string>
};

const FilterTabs = ({ currentTab } : FilterTabsProps) => {

  const tabs = [
    {
        name: 'Pending',
        value: 'pending',
    },
    {
        name: 'Approved',
        value: 'approved',
    },
    {
        name: 'Revoked',
        value: 'revoked',
    },
  ]

  return (
    <div class="tabs tabs-box">
        {tabs.map(tab => (
        <input
            type="radio"
            name={tab.value}
            class="tab flex-1"
            aria-label={tab.name}
            onChange={e => {
                if(e.currentTarget.checked) currentTab.value = tab.value
            }}
            checked={tab.value === currentTab.value}
        />
        ))}
    </div>
  );
};

export default FilterTabs;
