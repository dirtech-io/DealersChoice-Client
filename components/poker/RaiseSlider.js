const RaiseSlider = ({ min, max, onRaise }) => {
  const [value, setValue] = useState(min);

  return (
    <div className="raise-controls">
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => setValue(parseInt(e.target.value))}
      />
      <span>Amount: ${value}</span>
      <button onClick={() => onRaise(value)}>Confirm Raise to ${value}</button>
    </div>
  );
};
