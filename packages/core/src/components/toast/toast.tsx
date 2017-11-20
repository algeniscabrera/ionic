import { Component, Element, Event, EventEmitter, Listen, Prop } from '@stencil/core';
import { Animation, AnimationBuilder, AnimationController, Config, CssClassMap } from '../../index';

import iOSEnterAnimation from './animations/ios.enter';
import iOSLeaveAnimation from './animations/ios.leave';

@Component({
  tag: 'ion-toast',
  styleUrls: {
    ios: 'toast.ios.scss',
    md: 'toast.md.scss'
  },
  host: {
    theme: 'toast'
  }
})
export class Toast {
  private animation: Animation;

  @Element() private el: HTMLElement;

  /**
   * @output {ToastEvent} Emitted after the toast has loaded.
   */
  @Event() ionToastDidLoad: EventEmitter;

  /**
   * @output {ToastEvent} Emitted after the toast has presented.
   */
  @Event() ionToastDidPresent: EventEmitter;

  /**
   * @output {ToastEvent} Emitted before the toast has presented.
   */
  @Event() ionToastWillPresent: EventEmitter;

  /**
   * @output {ToastEvent} Emitted before the toast has dismissed.
   */
  @Event() ionToastWillDismiss: EventEmitter;

  /**
   * @output {ToastEvent} Emitted after the toast has dismissed.
   */
  @Event() ionToastDidDismiss: EventEmitter;

  /**
   * @output {ToastEvent} Emitted after the toast has unloaded.
   */
  @Event() ionToastDidUnload: EventEmitter;

  @Prop({ connect: 'ion-animation-controller' }) animationCtrl: AnimationController;
  @Prop({ context: 'config' }) config: Config;

  @Prop() message: string;
  @Prop() cssClass: string;
  @Prop() duration: number;
  @Prop() showCloseButton: boolean;
  @Prop() closeButtonText: string;
  @Prop() dismissOnPageChange: boolean;
  @Prop() position: string;
  @Prop() enterAnimation: AnimationBuilder;
  @Prop() exitAnimation: AnimationBuilder;
  @Prop() toastId: string;

  present() {
    return new Promise<void>(resolve => {
      this._present(resolve);
    });
  }

  private _present(resolve: Function) {
    if (this.animation) {
      this.animation.destroy();
      this.animation = null;
    }
    this.ionToastWillPresent.emit({ toast: this });

    // get the user's animation fn if one was provided
    let animationBuilder = this.enterAnimation;

    if (!animationBuilder) {
      // user did not provide a custom animation fn
      // decide from the config which animation to use
      animationBuilder = iOSEnterAnimation;
    }

    // build the animation and kick it off
    this.animationCtrl.create(animationBuilder, this.el, this.position).then(animation => {
      this.animation = animation;

      animation.onFinish((a: any) => {
        a.destroy();
        this.componentDidEnter();
        resolve();
      }).play();
    });
  }

  dismiss() {
    if (this.animation) {
      this.animation.destroy();
      this.animation = null;
    }
    return new Promise(resolve => {
      this.ionToastWillDismiss.emit({ toast: this });

      // get the user's animation fn if one was provided
      let animationBuilder = this.exitAnimation;
      if (!animationBuilder) {
        // user did not provide a custom animation fn
        // decide from the config which animation to use
        animationBuilder = iOSLeaveAnimation;
      }

      // build the animation and kick it off
      this.animationCtrl.create(animationBuilder, this.el, this.position).then(animation => {
        this.animation = animation;

        animation.onFinish((a: any) => {
          a.destroy();
          this.ionToastDidDismiss.emit({ toast: this });

          Context.dom.write(() => {
            this.el.parentNode.removeChild(this.el);
          });

          resolve();
        }).play();
      });
    });
  }

  componentDidLoad() {
    this.ionToastDidLoad.emit({ toast: this });
  }

  componentDidEnter() {
    this.ionToastDidPresent.emit({ toast: this });
    if (this.duration) {
      setTimeout(() => {
        this.dismiss();
      }, this.duration);
    }
  }

  componentDidUnload() {
    this.ionToastDidUnload.emit({ toast: this });
  }

  @Listen('ionDismiss')
  protected onDismiss(ev: UIEvent) {
    ev.stopPropagation();
    ev.preventDefault();

    this.dismiss();
  }

  render() {
    let userCssClass = 'toast-content';
    if (this.cssClass) {
      userCssClass += ' ' + this.cssClass;
    }

    return (
      <div class={this.wrapperClass()}>
        <div class='toast-container'>
          {this.message
            ? <div class='toast-message'>{this.message}</div>
            : null}
          {this.showCloseButton
            ? <ion-button clear color='light' class='toast-button' onClick={() => this.dismiss()}>
                {this.closeButtonText || 'Close'}
              </ion-button>
            : null}
        </div>
      </div>
    );
  }

  wrapperClass(): CssClassMap {
    let wrapperClass: string[] = !this.position
      ? ['toast-wrapper', 'toast-bottom']
      : [`toast-wrapper`, `toast-${this.position}`];
    return wrapperClass.reduce((prevValue: any, cssClass: any) => {
      prevValue[cssClass] = true;
      return prevValue;
    }, {});
  }

}

export interface ToastOptions {
  message?: string;
  cssClass?: string;
  duration?: number;
  showCloseButton?: boolean;
  closeButtonText?: string;
  dismissOnPageChange?: boolean;
  position?: string;
  enterAnimation?: AnimationBuilder;
  exitAnimation?: AnimationBuilder;
}

export interface ToastEvent {
  detail: {
    toast: Toast;
  };
}

export { iOSEnterAnimation, iOSLeaveAnimation };
