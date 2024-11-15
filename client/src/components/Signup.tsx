import { useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { Form, Button, Alert } from "react-bootstrap";
import Auth from "../utils/auth"; // This will handle storing the token

const SignupForm = ({ handleModalClose }: { handleModalClose: () => void }) => {
  const [userFormData, setUserFormData] = useState({ name: "", email: "", password: "" });
  const [validated, setValidated] = useState(false);
  const [showAlert, setShowAlert] = useState(false);

  // Handle form input change (name, email, or password)
  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setUserFormData({ ...userFormData, [name]: value });
  };

  // Form submission handler with logging
  const handleFormSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const form = event.currentTarget;
    setValidated(true); // Set the form to be validated on submission

    // Validate form before proceeding
    if (form.checkValidity() === false) {
      return;
    }

    try {
      if (userFormData.name && userFormData.email && userFormData.password) {
        // Construct GraphQL mutation for creating a new user
        const mutation = `
          mutation createUser($name: String!, $email: String!, $password: String!) {
            createUser(name: $name, email: $email, password: $password) {
              token
              developer {
                _id
                name
                email
              }
            }
          }
        `;

        // Send the signup request to the server
        const response = await fetch("http://localhost:3001/graphql", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            query: mutation,
            variables: {
              name: userFormData.name,
              email: userFormData.email,
              password: userFormData.password,
            },
          }),
        });

        // Handle the response
        if (!response.ok) {
          throw new Error("Signup failed");
        }

        const { data, errors } = await response.json();

        // Check if there are any errors in the response
        if (errors) {
          throw new Error(errors[0].message);
        }

        // If signup is successful, get the token and save it using Auth utility
        const { token } = data.createUser;
        Auth.login(token); // Save token to localStorage or context

        // Close the modal after successful signup
        handleModalClose();

        // Clear form data after successful signup
        setUserFormData({ name: "", email: "", password: "" });
      } else {
        setShowAlert(true); // Show alert if any required fields are missing
      }
    } catch (err) {
      console.error('Error during signup:', err);
      setShowAlert(true); // Display alert for signup failure
    }
  };

  return (
    <Form noValidate validated={validated} onSubmit={handleFormSubmit}>
      <Alert
        dismissible
        onClose={() => setShowAlert(false)}
        show={showAlert}
        variant="danger"
      >
        Something went wrong with your signup!
      </Alert>

      <Form.Group className="mb-3">
        <Form.Label htmlFor="name">Name</Form.Label>
        <Form.Control
          type="text"
          placeholder="Your full name"
          name="name"
          onChange={handleInputChange}
          value={userFormData.name}
          required
        />
        <Form.Control.Feedback type="invalid">
          Name is required!
        </Form.Control.Feedback>
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label htmlFor="email">Email</Form.Label>
        <Form.Control
          type="email"
          placeholder="Your email address"
          name="email"
          onChange={handleInputChange}
          value={userFormData.email}
          required
        />
        <Form.Control.Feedback type="invalid">
          Email is required!
        </Form.Control.Feedback>
      </Form.Group>

      <Form.Group className="mb-3">
        <Form.Label htmlFor="password">Password</Form.Label>
        <Form.Control
          type="password"
          placeholder="Your password"
          name="password"
          onChange={handleInputChange}
          value={userFormData.password}
          required
        />
        <Form.Control.Feedback type="invalid">
          Password is required!
        </Form.Control.Feedback>
      </Form.Group>

      <Button
        disabled={!(userFormData.name && userFormData.email && userFormData.password)} // Disable button if no input
        type="submit"
        variant="success"
      >
        Sign Up
      </Button>
    </Form>
  );
};

export default SignupForm;