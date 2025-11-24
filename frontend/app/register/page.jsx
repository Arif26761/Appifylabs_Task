"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import "@/assets/css/bootstrap.min.css";
import "@/assets/css/common.css";
import "@/assets/css/main.css";
import "@/assets/css/responsive.css";
import { api } from "../../api.js";


const register = () => {
    const router = useRouter();
    const [form, setForm] = useState({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        repeatPassword: "",
    });
    const [err, setErr] = useState("");

    const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    const onRegister = async () => {
        setErr("");
        if (form.password !== form.repeatPassword) {
            setErr("Passwords do not match");
            return;
        }
        try {
            await api.post("/auth/register", {
                firstName: form.firstName,
                lastName: form.lastName,
                email: form.email,
                password: form.password,
            });
            router.push("/feed");
        } catch (error) {
            setErr(error.response?.data?.message || "Registration failed");
        }   
    };


    return (
        <section className="_social_registration_wrapper _layout_main_wrapper">
        <div className="_social_registration_wrap">
            <div className="container">
            <div className="row align-items-center">
                <div className="col-xl-8 col-lg-8 col-md-12 col-sm-12">
                <div className="_social_registration_right">
                    <img src="/images/registration.png" alt="Image" />
                </div>
                </div>

                <div className="col-xl-4 col-lg-4 col-md-12 col-sm-12">
                <div className="_social_registration_content">
                    <div className="_social_registration_right_logo _mar_b28">
                    <img src="/images/logo.svg" alt="Image" className="_right_logo" />
                    </div>

                    <p className="_social_registration_content_para _mar_b8">
                    Get Started Now
                    </p>
                    <h4 className="_social_registration_content_title _titl4 _mar_b50">
                    Registration
                    </h4>

                    {err && <p style={{ color: "red" }}>{err}</p>}

                    <form className="_social_registration_form" onSubmit={(e)=>e.preventDefault()}>
                    <div className="row">
                        <div className="col-12">
                        <label className="_social_registration_label _mar_b8">
                            First Name
                        </label>
                        <input
                            name="firstName"
                            className="form-control _social_registration_input"
                            value={form.firstName}
                            onChange={onChange}
                        />
                        </div>

                        <div className="col-12">
                        <label className="_social_registration_label _mar_b8">
                            Last Name
                        </label>
                        <input
                            name="lastName"
                            className="form-control _social_registration_input"
                            value={form.lastName}
                            onChange={onChange}
                        />
                        </div>

                        <div className="col-12">
                        <label className="_social_registration_label _mar_b8">Email</label>
                        <input
                            name="email"
                            type="email"
                            className="form-control _social_registration_input"
                            value={form.email}
                            onChange={onChange}
                        />
                        </div>

                        <div className="col-12">
                        <label className="_social_registration_label _mar_b8">
                            Password
                        </label>
                        <input
                            name="password"
                            type="password"
                            className="form-control _social_registration_input"
                            value={form.password}
                            onChange={onChange}
                        />
                        </div>

                        <div className="col-12">
                        <label className="_social_registration_label _mar_b8">
                            Repeat Password
                        </label>
                        <input
                            name="repeatPassword"
                            type="password"
                            className="form-control _social_registration_input"
                            value={form.repeatPassword}
                            onChange={onChange}
                        />
                        </div>
                    </div>

                    <div className="_social_registration_form_btn _mar_t40 _mar_b60">
                        <button
                        type="button"
                        className="_social_registration_form_btn_link _btn1"
                        onClick={onRegister}
                        >
                        Register now
                        </button>
                    </div>
                    </form>

                    <p className="_social_registration_bottom_txt_para">
                    Already have account? <a href="/login">Login</a>
                    </p>
                </div>
                </div>

            </div>
            </div>
        </div>
        </section>
    );
}

export default register