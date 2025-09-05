import { useField } from "formik";
import { TextField } from "@mui/material";

export default function FormikTextField({ name, label, type = "text", ...props }) {
  const [field, meta] = useField(name);

  return (
    <TextField
      {...field}
      {...props}
      type={type}
      label={label}
      variant="outlined"
      fullWidth
      margin="normal"
      error={meta.touched && Boolean(meta.error)}
      helperText={meta.touched && meta.error}
    />
  );
}
