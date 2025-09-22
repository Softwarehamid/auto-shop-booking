import type { Handler } from "@netlify/functions";
import { z } from "zod";
import { Resend } from "resend";
import { readFileSync } from "fs";
import { join } from "path";

// Initialize Resend with API key from environment variables
const resend = new Resend(process.env.RESEND_API_KEY);

// This is a simplified version for demonstration
// In production, you would:
// 1. Use a proper database connection with connection pooling
// 2. Implement proper error handling and logging
// 3. Add proper validation and sanitization
// 4. Implement rate limiting and security measures

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

const BookingSchema = z.object({
  serviceId: z.number().positive(),
  staffId: z.number().positive(),
  timeslotId: z.number().positive(),
  customerName: z.string().min(2).max(100),
  customerEmail: z.string().email(),
  customerPhone: z.string().optional(),
  notes: z.string().max(500).optional(),
});

// Email template helper function
function loadTemplate(templateName: string): string {
  try {
    // Try multiple possible paths for template loading
    const possiblePaths = [
      join(__dirname, "templates", `${templateName}.html`),
      join(
        process.cwd(),
        "netlify",
        "functions",
        "templates",
        `${templateName}.html`
      ),
      join(__dirname, "..", "functions", "templates", `${templateName}.html`),
    ];

    for (const templatePath of possiblePaths) {
      try {
        return readFileSync(templatePath, "utf-8");
      } catch (err) {
        // Continue to next path
      }
    }

    throw new Error("Template not found in any path");
  } catch (error) {
    console.error(`Failed to load template ${templateName}:`, error);

    // Fallback templates
    if (templateName === "customer-confirmation") {
      return `
        <html>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #2563eb, #1e40af); color: white; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; font-size: 24px;">🚗 AutoDetail Pro</h1>
              <p style="margin: 10px 0 0 0;">Professional Car Care Services</p>
            </div>
            <div style="background: white; padding: 30px 20px; border: 1px solid #e5e7eb; border-radius: 0 0 8px 8px;">
              <div style="background: #ecfdf5; border: 2px solid #10b981; border-radius: 8px; padding: 20px; text-align: center; margin-bottom: 20px;">
                <h2 style="color: #10b981; margin: 0;">✅ Booking Confirmed!</h2>
                <p style="margin: 10px 0 0 0;">Your {{serviceName}} appointment is all set.</p>
              </div>
              <p>Hi {{customerName}},</p>
              <p>Thank you for choosing AutoDetail Pro! Your appointment has been successfully booked.</p>
              <div style="background: #f8fafc; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <h3 style="margin-top: 0;">Appointment Details</h3>
                <p><strong>Service:</strong> {{serviceName}}</p>
                <p><strong>Technician:</strong> {{technicianName}}</p>
                <p><strong>Date:</strong> {{appointmentDate}}</p>
                <p><strong>Time:</strong> {{appointmentTime}}</p>
                <p><strong>Duration:</strong> {{duration}}</p>
                <p><strong>Price:</strong> {{price}}</p>
                {{#if notes}}<p><strong>Notes:</strong> {{notes}}</p>{{/if}}
              </div>
              <p>We'll send you a reminder 24 hours before your appointment.</p>
              <p>Best regards,<br><strong>The AutoDetail Pro Team</strong></p>
            </div>
          </body>
        </html>
      `;
    } else if (templateName === "admin-notification") {
      return `
        <html>
          <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #f59e0b, #d97706); color: white; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; font-size: 24px;">🚗 AutoDetail Pro</h1>
              <p style="margin: 10px 0 0 0;">New Booking Alert</p>
            </div>
            <div style="background: white; padding: 30px 20px; border: 1px solid #e5e7eb; border-radius: 0 0 8px 8px;">
              <div style="background: #fef3c7; border: 2px solid #f59e0b; border-radius: 8px; padding: 20px; text-align: center; margin-bottom: 20px;">
                <h2 style="color: #d97706; margin: 0;">🔔 New Booking Received!</h2>
                <p style="margin: 10px 0 0 0;">A customer has just booked a {{serviceName}} service.</p>
              </div>
              <div style="background: #f8fafc; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <h3 style="margin-top: 0;">Appointment Details</h3>
                <p><strong>Booking ID:</strong> #{{bookingId}}</p>
                <p><strong>Service:</strong> {{serviceName}}</p>
                <p><strong>Technician:</strong> {{technicianName}}</p>
                <p><strong>Date:</strong> {{appointmentDate}}</p>
                <p><strong>Time:</strong> {{appointmentTime}}</p>
                <p><strong>Duration:</strong> {{duration}}</p>
                <p><strong>Price:</strong> {{price}}</p>
                {{#if notes}}<p><strong>Notes:</strong> {{notes}}</p>{{/if}}
              </div>
              <div style="background: #ecfdf5; border-left: 4px solid #10b981; padding: 20px; margin: 20px 0;">
                <h3 style="margin-top: 0;">Customer Information</h3>
                <p><strong>Name:</strong> {{customerName}}</p>
                <p><strong>Email:</strong> {{customerEmail}}</p>
                {{#if customerPhone}}<p><strong>Phone:</strong> {{customerPhone}}</p>{{/if}}
              </div>
            </div>
          </body>
        </html>
      `;
    }

    // Generic fallback
    return `
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <h2>{{title}}</h2>
          <p>{{content}}</p>
        </body>
      </html>
    `;
  }
}

// Template replacement helper
function replaceTemplateVariables(
  template: string,
  variables: Record<string, any>
): string {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`{{${key}}}`, "g");
    result = result.replace(regex, String(value || ""));
  }

  // Handle conditional blocks like {{#if notes}}...{{/if}}
  result = result.replace(
    /{{#if\s+(\w+)}}(.*?){{\/if}}/gs,
    (match, condition, content) => {
      return variables[condition] ? content : "";
    }
  );

  return result;
}

// Send confirmation email to customer
async function sendCustomerConfirmation(bookingData: any): Promise<void> {
  const template = loadTemplate("customer-confirmation");

  const emailVariables = {
    customerName: bookingData.customerName,
    serviceName: bookingData.serviceName,
    technicianName: bookingData.technicianName,
    appointmentDate: bookingData.appointmentDate,
    appointmentTime: bookingData.appointmentTime,
    duration: bookingData.duration,
    price: bookingData.price,
    notes: bookingData.notes,
    cancelLink: `${process.env.SITE_URL}/cancel?booking=${bookingData.bookingId}&token=${bookingData.cancelToken}`,
  };

  const htmlContent = replaceTemplateVariables(template, emailVariables);

  console.log("Sending customer email to:", bookingData.customerEmail);
  console.log("From email:", process.env.FROM_EMAIL);

  const emailResult = await resend.emails.send({
    from: process.env.FROM_EMAIL || "onboarding@resend.dev",
    to: [bookingData.customerEmail],
    subject: `Booking Confirmed: ${bookingData.serviceName} - ${bookingData.appointmentDate}`,
    html: htmlContent,
  });

  console.log("Customer email result:", emailResult);
}

// Send notification email to admin/shop
async function sendAdminNotification(bookingData: any): Promise<void> {
  const template = loadTemplate("admin-notification");

  const emailVariables = {
    bookingId: bookingData.bookingId,
    customerName: bookingData.customerName,
    customerEmail: bookingData.customerEmail,
    customerPhone: bookingData.customerPhone,
    serviceName: bookingData.serviceName,
    technicianName: bookingData.technicianName,
    appointmentDate: bookingData.appointmentDate,
    appointmentTime: bookingData.appointmentTime,
    duration: bookingData.duration,
    price: bookingData.price,
    notes: bookingData.notes,
    bookingTime: new Date().toLocaleString(),
  };

  const htmlContent = replaceTemplateVariables(template, emailVariables);

  console.log("Sending admin email to:", process.env.ADMIN_EMAIL);

  const adminEmailResult = await resend.emails.send({
    from: process.env.FROM_EMAIL || "onboarding@resend.dev",
    to: [process.env.ADMIN_EMAIL || "admin@autodetailpro.com"],
    subject: `New Booking Alert: ${bookingData.serviceName} - ${bookingData.appointmentDate}`,
    html: htmlContent,
  });

  console.log("Admin email result:", adminEmailResult);
}

export const handler: Handler = async (event, context) => {
  // Handle CORS preflight
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: "",
    };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  try {
    const body = JSON.parse(event.body || "{}");
    const validatedData = BookingSchema.parse(body);

    // In production, this would:
    // 1. Connect to Supabase with service role key
    // 2. Begin database transaction
    // 3. Lock the timeslot and verify it's still available
    // 4. Create the booking record
    // 5. Send confirmation emails via Resend
    // 6. Return booking ID and cancel token

    // For demonstration, return mock success response
    const mockBookingId = Math.floor(Math.random() * 10000);
    const mockCancelToken = "cancel-" + Math.random().toString(36).substr(2, 9);

    console.log("Booking request:", validatedData);

    // Mock booking data for email sending
    const bookingEmailData = {
      bookingId: mockBookingId,
      cancelToken: mockCancelToken,
      customerName: validatedData.customerName,
      customerEmail: validatedData.customerEmail,
      customerPhone: validatedData.customerPhone,
      serviceName: "Paint Correction", // In production, fetch from database
      technicianName: "Sarah Chen", // In production, fetch from database
      appointmentDate: "Thursday, October 2, 2025", // In production, format from timeslot
      appointmentTime: "5:00 AM - 5:30 AM", // In production, format from timeslot
      duration: "3 hours", // In production, fetch from service
      price: "$299.99", // In production, format from service price
      notes: validatedData.notes,
    };

    // Send emails
    try {
      if (process.env.RESEND_API_KEY) {
        await Promise.all([
          sendCustomerConfirmation(bookingEmailData),
          sendAdminNotification(bookingEmailData),
        ]);
        console.log("Confirmation emails sent successfully");
      } else {
        console.log(
          "Resend API key not configured - emails would be sent in production"
        );
      }
    } catch (emailError) {
      console.error("Failed to send emails:", emailError);
      // Don't fail the booking if email fails - log the error and continue
    }

    return {
      statusCode: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        bookingId: mockBookingId,
        cancelToken: mockCancelToken,
        message: "Booking created successfully",
      }),
    };
  } catch (error) {
    console.error("Booking creation error:", error);

    if (error instanceof z.ZodError) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({
          error: "Invalid data",
          details: (error as z.ZodError).issues,
        }),
      };
    }

    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        error: "Internal server error",
      }),
    };
  }
};
