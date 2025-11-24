"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "../../api.js";
import "@/assets/css/bootstrap.min.css";
import "@/assets/css/common.css";
import "@/assets/css/main.css";
import "@/assets/css/responsive.css";

const login = () => {
    const router = useRouter();
    const [form, setForm] = useState({ email: "", password: "" });
    const [err, setErr] = useState("");

    const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    const onLogin = async () => {
        setErr("");
        try {
            await api.post("/auth/login", form);
            router.push("/feed");
        } catch (error) {
            setErr(error.response?.data?.message || "Login failed");
        }
    };


    return (
        <section className="_social_login_wrapper _layout_main_wrapper">
        {/* keep your shapes + layout same */}
        <div className="_social_login_wrap">
            <div className="container">
            <div className="row align-items-center">
                <div className="col-xl-8 col-lg-8 col-md-12 col-sm-12">
                <div className="_social_login_left">
                    <div className="_social_login_left_image">
                    <img src="/images/login.png" alt="Image" className="_left_img" />
                    </div>
                </div>
                </div>

                <div className="col-xl-4 col-lg-4 col-md-12 col-sm-12">
                <div className="_social_login_content">
                    <div className="_social_login_left_logo _mar_b28">
                    <img src="/images/logo.svg" alt="Image" className="_left_logo" />
                    </div>

                    <p className="_social_login_content_para _mar_b8">Welcome back</p>
                    <h4 className="_social_login_content_title _titl4 _mar_b50">
                    Login to your account
                    </h4>

                    {err && <p style={{ color: "red" }}>{err}</p>}

                    <form className="_social_login_form" onSubmit={(e)=>e.preventDefault()}>
                    <div className="row">
                        <div className="col-12">
                        <div className="_social_login_form_input _mar_b14">
                            <label className="_social_login_label _mar_b8">Email</label>
                            <input
                            name="email"
                            type="email"
                            className="form-control _social_login_input"
                            value={form.email}
                            onChange={onChange}
                            />
                        </div>
                        </div>

                        <div className="col-12">
                        <div className="_social_login_form_input _mar_b14">
                            <label className="_social_login_label _mar_b8">Password</label>
                            <input
                            name="password"
                            type="password"
                            className="form-control _social_login_input"
                            value={form.password}
                            onChange={onChange}
                            />
                        </div>
                        </div>
                    </div>

                    <div className="_social_login_form_btn _mar_t40 _mar_b60">
                        <button
                        type="button"
                        className="_social_login_form_btn_link _btn1"
                        onClick={onLogin}
                        >
                        Login now
                        </button>
                    </div>
                    </form>

                    <p className="_social_login_bottom_txt_para">
                    Dont have an account?{" "}
                    <a href="/register">Create New Account</a>
                    </p>
                </div>
                </div>

            </div>
            </div>
        </div>
        </section>
    );
}

export default login